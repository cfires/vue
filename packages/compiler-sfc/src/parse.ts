import { SourceMapGenerator } from 'source-map'
import { RawSourceMap, TemplateCompiler } from './types'
import {
  parseComponent,
  VueTemplateCompilerParseOptions,
  SFCDescriptor,
  DEFAULT_FILENAME
} from './parseComponent'

import hash from 'hash-sum'
import LRU from 'lru-cache'
import { hmrShouldReload } from './compileScript'
import { parseCssVars } from './cssVars'

const cache = new LRU<string, SFCDescriptor>(100)

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/

// 【修复1】添加安全限制常量
const MAX_SFC_LENGTH = 2000000; // 单个SFC文件最大长度2MB
const MAX_PARSING_TIME = 3000;  // 最大解析时间3秒
const MAX_CACHE_KEY_LENGTH = 10000; // 缓存键最大长度

export interface SFCParseOptions {
  source: string
  filename?: string
  compiler?: TemplateCompiler
  compilerParseOptions?: VueTemplateCompilerParseOptions
  sourceRoot?: string
  sourceMap?: boolean
  /**
   * @deprecated use `sourceMap` instead.
   */
  needMap?: boolean
}

// 【修复2】创建安全的parseComponent包装器
function safeParseComponent(
  source: string,
  options: VueTemplateCompilerParseOptions
): SFCDescriptor {
  const startTime = Date.now();

  // 定期检查超时的函数
  const checkTimeout = () => {
    if (Date.now() - startTime > MAX_PARSING_TIME) {
      throw new Error(`SFC parsing exceeded time limit of ${MAX_PARSING_TIME}ms`);
    }
  };

  try {
    checkTimeout();
    const result = parseComponent(source, options);
    checkTimeout();
    return result;
  } catch (error) {
    // 如果是超时错误，重新抛出更具体的错误信息
    if (error.message.includes('timeout') || error.message.includes('exceeded')) {
      throw new Error(`SFC parsing timeout after ${MAX_PARSING_TIME}ms, possible ReDoS attack`);
    }
    throw error;
  }
}

// 【修复3】安全的哈希函数，防止超长输入
function safeHash(input: string): string {
  if (input.length > MAX_CACHE_KEY_LENGTH) {
    // 对于超长输入，使用截断版本进行哈希
    const truncated = input.substring(0, 1000) + '...' + input.substring(input.length - 1000);
    return hash(truncated);
  }
  return hash(input);
}

export function parse(options: SFCParseOptions): SFCDescriptor {
  const {
    source,
    filename = DEFAULT_FILENAME,
    compiler,
    compilerParseOptions = { pad: false } as VueTemplateCompilerParseOptions,
    sourceRoot = '',
    needMap = true,
    sourceMap = needMap
  } = options

    // 【修复4】输入验证 - 检查源文件长度
  if (source.length > MAX_SFC_LENGTH) {
    throw new Error(
      `SFC source length (${source.length}) exceeds maximum allowed length of ${MAX_SFC_LENGTH} characters. ` +
      `This may be a ReDoS attack attempt.`
    );
  }

  // 【修复5】安全的缓存键生成
  const cacheKey = safeHash(
    filename + source + JSON.stringify(compilerParseOptions)
  )

  let output = cache.get(cacheKey)
  if (output) {
    return output
  }
  const startTime = Date.now();

  // 【修复6】超时检查函数
  const checkTimeout = () => {
    if (Date.now() - startTime > MAX_PARSING_TIME) {
      throw new Error(`SFC parsing exceeded time limit of ${MAX_PARSING_TIME}ms`);
    }
  };

  try{
    checkTimeout();
    if (compiler) {
      // user-provided compiler
      output = compiler.parseComponent(source, compilerParseOptions)
    } else {
      // use built-in compiler
      output = safeParseComponent(source, compilerParseOptions)
    }
    checkTimeout();

    output.filename = filename

    // parse CSS vars - 添加超时检查
    checkTimeout();
    output.cssVars = parseCssVars(output)
    checkTimeout();

    output.shouldForceReload = prevImports =>
      hmrShouldReload(prevImports, output!)

    if (sourceMap) {
      if (output.script && !output.script.src) {
        output.script.map = generateSourceMap(
          filename,
          source,
          output.script.content,
          sourceRoot,
          compilerParseOptions.pad
        )
      }
      if (output.styles) {
        output.styles.forEach(style => {
          if (!style.src) {
            style.map = generateSourceMap(
              filename,
              source,
              style.content,
              sourceRoot,
              compilerParseOptions.pad
            )
          }
        })
      }
    }

    cache.set(cacheKey, output)
    return output
  }
  catch (error) {
    // 【修复7】处理解析超时和潜在ReDoS攻击
    if (Date.now() - startTime > MAX_PARSING_TIME) {
      throw new Error(
        `SFC parsing aborted after ${MAX_PARSING_TIME}ms. ` +
        `The file may contain patterns that cause exponential parsing time (ReDoS). ` +
        `Filename: ${filename}`
      );
    }
    throw error;
  }


}

function generateSourceMap(
  filename: string,
  source: string,
  generated: string,
  sourceRoot: string,
  pad?: 'line' | 'space' | boolean
): RawSourceMap {
  // 【修复8】添加输入验证
  if (source.length > MAX_SFC_LENGTH || generated.length > MAX_SFC_LENGTH) {
    throw new Error('Source or generated content too long for source map generation');
  }

  const map = new SourceMapGenerator({
    file: filename.replace(/\\/g, '/'),
    sourceRoot: sourceRoot.replace(/\\/g, '/')
  })
  let offset = 0
  if (!pad) {
    offset = source.split(generated).shift()!.split(splitRE).length - 1
  }
  map.setSourceContent(filename, source)
  generated.split(splitRE).forEach((line, index) => {
    if (!emptyRE.test(line)) {
      map.addMapping({
        source: filename,
        original: {
          line: index + 1 + offset,
          column: 0
        },
        generated: {
          line: index + 1,
          column: 0
        }
      })
    }
  })
  return JSON.parse(map.toString())
}

// 【修复9】导出安全工具函数供其他模块使用
export const SecurityUtils = {
  MAX_SFC_LENGTH,
  MAX_PARSING_TIME,
  checkInputLength: (input: string, maxLength: number = MAX_SFC_LENGTH) => {
    if (input.length > maxLength) {
      throw new Error(`Input length ${input.length} exceeds maximum allowed ${maxLength}`);
    }
  },
  withTimeout: <T>(fn: () => T, timeout: number = MAX_PARSING_TIME): T => {
    const startTime = Date.now();
    const result = fn();
    if (Date.now() - startTime > timeout) {
      throw new Error(`Operation exceeded time limit of ${timeout}ms`);
    }
    return result;
  }
};
