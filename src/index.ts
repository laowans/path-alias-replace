import fs from 'fs';
import path from 'path';
import { Watch } from './watch';
import { Options, WatchOpitons } from '@type';
import { replace, ReplaceOptions } from './replace';

// 获取配置对象
function getOptions<T, K extends keyof T>(o: T | undefined, k: K[], d: Partial<Pick<T, K>>) {
	if (o) {
		const options: { [a: string]: any } = {};
		const keys = Object.keys(o as Object);

		k.forEach((key) => {
			if (keys.includes(key as string)) {
				options[key as string] = o[key];
			}
		});

		return { ...d, ...options } as Required<Pick<T, K>>;
	} else {
		return d as Required<Pick<T, K>>;
	}
}

/**
 * 路径别名替换
 */
export function pathAliasReplace(opitons: Options) {
	// 替换配置对象
	const replaceOptions: ReplaceOptions = getOptions(
		opitons,
		[
			'sweepPath',
			'alias',
			'outputPath',
			'ext',
			'require',
			'import',
			'importAutoAddExtension',
			'outputReplacementInfo',
			'createOutputPath',
		],
		{
			ext: ['js'],
			require: true,
			import: true,
			importAutoAddExtension: ['js', 'mjs', 'json', 'node'],
			outputReplacementInfo: opitons.watch ? false : true,
			createOutputPath: true,
		}
	);

	if (opitons.watch) {
		// 监控配置对象
		const watchOpitons: WatchOpitons = getOptions(
			opitons.watchOpitons,
			[
				'ignored',
				'outputMsg',
				'rbefore',
				'rafter',
				'rbeforeImmediate',
				'rafterImmediate',
				'rbeforeCwd',
				'rafterCwd',
				'rbeforeEnv',
				'rafterEnv',
			],
			{
				ignored: void 0,
				outputMsg: true,
				rbeforeImmediate: true,
				rafterImmediate: true,
			}
		);

		let watchPath: string;

		if (opitons.watchOpitons && opitons.watchOpitons.watchPath) {
			watchPath = opitons.watchOpitons.watchPath;
		} else {
			watchPath = opitons.sweepPath;
		}

		// 创建监控实例
		new Watch(watchPath, watchOpitons, () => replace(replaceOptions));
	} else {
		replace(replaceOptions);
	}
}

/**
 * 删除指定目录下的的所有文件和文件夹
 */
export function deleteFolderRecursive(folderPath: string) {
	function func(folderPath: string, s: boolean = false) {
		if (fs.existsSync(folderPath)) {
			fs.readdirSync(folderPath).forEach((file) => {
				const curPath = path.join(folderPath, file);

				if (fs.lstatSync(curPath).isDirectory()) {
					// 递归删除子文件夹
					func(curPath);
				} else {
					try {
						// 删除文件
						fs.unlinkSync(curPath);
					} catch (error) {
						throw error;
					}
				}
			});
			try {
				// 删除文件夹本身
				if (!s) fs.rmdirSync(folderPath);
			} catch (error) {
				throw error;
			}
		}
	}

	func(folderPath, true);
}
