import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Options } from '@type';
import { addExtension } from './utils/addExtension';

// 替换信息类型
interface ReplaceInfo {
	[key: string]: string[][];
}

// 替换函数配置项
export type ReplaceOptions = Required<
	Pick<
		Options,
		| 'sweepPath'
		| 'alias'
		| 'ext'
		| 'import'
		| 'require'
		| 'outputReplacementInfo'
		| 'importAutoAddExtension'
		| 'createOutputPath'
	>
> & {
	outputPath: Options['outputPath'];
};

// 转义正则
function regexpEscape(s: string) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// 匹配 require 导入
const requireRegExp = /(require\(['"])(.+)(['"]\))/g;
// 匹配 import 导入
const importRegExp1 = /(import .+ from ['"])(.+)(['"])/g; // import …… from {……}
const importRegExp2 = /(import ['"])(.+)(['"])/g; // import {……}
const importRegExp3 = /(import\(['"])(.+)(['"]\))/g; // import({……})
const importRegExp4 = /(export .+ from ['"])(.+)(['"])/g; // export …… from {……}
// 匹配文件扩展名
const extRegExp = /.*\.([a-zA-Z0-9]+)$/;

/**
 * 格式化相对路径
 * @param p relativePath / from
 * @param t to
 */
function formatRelativePath(p: string, t?: string) {
	if (t) {
		p = path.relative(p, t);
	}

	if (path.isAbsolute(p)) {
		return p;
	} else {
		// 替换: \ -> /
		p = p.replace(/\\/g, '/');

		// 判断是否需要加 ./
		if (!/^\.\./.test(p)) {
			p = './' + p;
		}
	}

	return p;
}

/**
 * 替换方法
 */
export function replace(options: ReplaceOptions) {
	// 替换信息
	const replaceInfo: ReplaceInfo = {};
	// 是否写入
	let isWrite = false;

	// 输出信息
	function outputInfo() {
		if (Object.keys(replaceInfo).length > 0) {
			const space = '  ';
			console.log(chalk.blue('path alias replace info'));

			// 格式化信息
			for (const key in replaceInfo) {
				console.log(space + key);

				replaceInfo[key].forEach((a, i) => {
					let prefix = '└──';
					if (i < replaceInfo[key].length - 1) prefix = '├──';

					console.log(space + `${prefix} ${a[0]} ${chalk.yellow('->')} ${a[1]}`);
				});
			}
		}
	}

	// 替换回调
	function replaceCallback(curPath: string, type: 'import' | 'require') {
		return function (_match: string, p1: string, p2: string, p3: string) {
			const old = p2; // 原始路径
			const from = path.dirname(curPath);
			let to: string | undefined;
			let addInfo = false; // 是否要添加替换信息

			// 循环匹配别名
			for (const key in options.alias) {
				// 生成正则(/^@\//)
				const reg = new RegExp('^' + regexpEscape(key) + '/');

				if (reg.test(p2)) {
					// 去除别名代码 (@/)
					const d = p2.replace(reg, '');

					// 拼接路径
					to = path.join(options.alias[key], d);

					break;
				} else if (key === p2) {
					// 防止导入路径只有别名时不会替换
					to = options.alias[key];

					break;
				}
			}

			if (to) {
				// 判断是否需要添加别名
				if (type === 'import' && options.importAutoAddExtension) {
					const { newImportPath, change } = addExtension(to, options.importAutoAddExtension);

					if (change) {
						to = newImportPath;
					}
				}

				p2 = formatRelativePath(from, to);

				addInfo = true;

				isWrite = true;
			} else {
				// 判断是否需要添加别名
				if (type === 'import' && options.importAutoAddExtension && /^\.?\.\//.test(p2)) {
					const { newImportPath, change } = addExtension(path.join(from, p2), options.importAutoAddExtension);

					if (change) {
						p2 = formatRelativePath(from, newImportPath);

						addInfo = true;

						isWrite = true;
					}
				}
			}

			// 判断是否需要添加信息
			if (options.outputReplacementInfo && addInfo) {
				// 替换文件路径
				const filePath = path.relative(options.sweepPath, curPath).replace(/\\/g, '/');

				const m1 = chalk.gray(p1) + chalk.green(old) + chalk.gray(p3); // old
				const m2 = chalk.gray(p1) + chalk.green(p2) + chalk.gray(p3); // new

				if (replaceInfo[filePath]) {
					replaceInfo[filePath].push([m1, m2]);
				} else {
					replaceInfo[filePath] = [[m1, m2]];
				}
			}

			return p1 + p2 + p3;
		};
	}

	// 扫描目录
	function sweep(dirPath: string, writePath?: string) {
		if (fs.existsSync(dirPath)) {
			fs.readdirSync(dirPath).forEach((file) => {
				const curPath = path.join(dirPath, file);
				// 写入路径
				let _writePath = writePath ? path.join(writePath, file) : void 0;

				if (fs.lstatSync(curPath).isDirectory()) {
					// 若有写入路径，则判断是否需要创建文件
					if (_writePath && !fs.existsSync(_writePath)) {
						fs.mkdirSync(_writePath);
					}

					// 递归
					sweep(curPath, _writePath);
				} else {
					// 匹配扩展名
					const match = file.match(extRegExp);

					if (match && options.ext.includes(match[1])) {
						// 读取文件
						let content = fs.readFileSync(curPath).toString();
						// 初始化值
						isWrite = false;

						// 是否需要匹配 require 导入
						if (options.require) {
							content = content.replace(requireRegExp, replaceCallback(curPath, 'require'));
						}

						// 是否需要匹配 import 导入
						if (options.import) {
							content = content.replace(importRegExp1, replaceCallback(curPath, 'import'));
							content = content.replace(importRegExp2, replaceCallback(curPath, 'import'));
							content = content.replace(importRegExp3, replaceCallback(curPath, 'import'));
							content = content.replace(importRegExp4, replaceCallback(curPath, 'import'));
						}

						// 判断是否需要写入
						if ((_writePath && !fs.existsSync(_writePath)) || isWrite) {
							fs.writeFileSync(_writePath ? _writePath : curPath, content);
						}
					}
				}
			});
		}
	}

	// 判断是否需要创建输出目录
	if (options.outputPath && options.createOutputPath && !fs.existsSync(options.outputPath)) {
		fs.mkdirSync(options.outputPath);
	}

	sweep(options.sweepPath, options.outputPath);

	// 是否需要输出替换信息
	if (options.outputReplacementInfo) {
		outputInfo();
	}
}
