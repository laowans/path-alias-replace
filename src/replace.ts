import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Options } from '@type';
import { addExtension } from './utils/addExtension';

interface ReplaceInfo {
	[key: string]: string[][];
}

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
const importRegExp = /(import .+ from ['"])(.+)(['"])/g;
// 匹配文件扩展名
const extRegExp = /.*\.([a-zA-Z0-9]+)$/;

export function replace(options: ReplaceOptions) {
	// 替换信息
	const replaceInfo: ReplaceInfo = {};
	// 是否写入
	let isWrite = false;

	// 输出信息
	function outputInfo() {
		if (Object.keys(replaceInfo).length > 0) {
			const space = '  ';
			console.log(chalk.blue('replace path alias info'));

			// 格式化信息
			for (const key in replaceInfo) {
				console.log(space + key);

				replaceInfo[key].forEach((a, i) => {
					let prefix = '└──';
					if (i < replaceInfo[key].length - 1) prefix = '├──';

					console.log(space + `${prefix} ${chalk.green(a[0])} -> ${chalk.green(a[1])}`);
				});
			}
		}
	}

	// 替换回调
	function replaceCallback(curPath: string, type: 'import' | 'require') {
		return function (_match: string, p1: string, p2: string, p3: string) {
			const old = p2; // 原始路径
			const from = path.dirname(curPath);
			let to;

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
				}
			}

			if (to) {
				if (type === 'import' && options.importAutoAddExtension) {
					const { newImportPath } = addExtension(to, options.importAutoAddExtension);

					to = newImportPath;
				}

				// 获取相对路径
				let newPath = path.relative(from, to);

				if (path.isAbsolute(newPath)) {
					p2 = newPath;
				} else {
					// 替换 \ -> /
					p2 = newPath.replace(/\\/g, '/');

					// 判断是否需要加 ./
					if (!/^\.\./.test(p2)) {
						p2 = './' + p2;
					}
				}

				// 判断是否需要添加信息
				if (options.outputReplacementInfo) {
					const filePath = path.relative(options.sweepPath, curPath).replace(/\\/g, '/');

					if (replaceInfo[filePath]) {
						replaceInfo[filePath].push([old, p2]);
					} else {
						replaceInfo[filePath] = [[old, p2]];
					}
				}

				isWrite = true;
			} else {
				if (type === 'import' && options.importAutoAddExtension && /^\.?\.\//.test(p2)) {
					const { newImportPath, change } = addExtension(path.join(from, p2), options.importAutoAddExtension);

					if (change) {
						// 替换 \ -> /
						p2 = path.relative(from, newImportPath).replace(/\\/g, '/');

						// 判断是否需要加 ./
						if (!/^\.\./.test(p2)) {
							p2 = './' + p2;
						}

						isWrite = true;
					}
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
							content = content.replace(importRegExp, replaceCallback(curPath, 'import'));
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
