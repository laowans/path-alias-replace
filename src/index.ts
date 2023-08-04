import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Watch } from './watch';
import { kill } from './utils/kill';
import { debounce } from './utils/debounce';
import { Options, WatchOpitons } from '@type';
import { replace, ReplaceOptions } from './replace';
import { spawn, ChildProcess, ProcessEnvOptions } from 'child_process';

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

// 创建进程
function createProcess(
	command: string,
	exitCallback?: Function,
	env?: ProcessEnvOptions['env'],
	cwd?: ProcessEnvOptions['cwd']
) {
	console.log(chalk.green(`run command  "${command}"`));

	return spawn(command, { stdio: 'inherit', shell: true, env, cwd }).on('exit', () => {
		console.log(chalk.red(`exit command "${command}"`));

		if (exitCallback) exitCallback();
	});
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
		// 防抖延时
		const wait = 100;
		// 监控配置对象
		const watchOpitons: WatchOpitons = getOptions(opitons.watchOpitons, ['ignored', 'outputMsg'], {
			ignored: void 0,
			outputMsg: true,
		});

		let watchPath: string;

		if (opitons.watchOpitons && opitons.watchOpitons.watchPath) {
			watchPath = opitons.watchOpitons.watchPath;
		} else {
			watchPath = opitons.sweepPath;
		}

		// 创建监控实例
		const watcher = new Watch(watchPath, watchOpitons);

		// 变化时替换路径别名
		watcher.on((next) => {
			replace(replaceOptions);

			next();
		});

		if (opitons.watchOpitons) {
			// 进程实例
			let rbeforeProcess: ChildProcess | null;
			let rafterProcess: ChildProcess | null;

			const immediate = getOptions(opitons.watchOpitons, ['rbeforeImmediate', 'rafterImmediate'], {
				rbeforeImmediate: true,
				rafterImmediate: true,
			});

			if (opitons.watchOpitons.rbefore) {
				// 替换前执行命令
				const command = opitons.watchOpitons.rbefore;
				// 子进程是否退出
				let exit = false;

				// 创建进程
				const cp = () => {
					exit = false;
					return createProcess(
						command,
						() => {
							rbeforeProcess = null;
							exit = true;
						},
						opitons.watchOpitons?.rbeforeEnv,
						opitons.watchOpitons?.rbeforeCwd
					);
				};

				// 是否要在初始化时执行 rbefore
				if (immediate.rbeforeImmediate) rbeforeProcess = cp();

				// 防抖处理
				const fn = debounce((next: Function) => {
					if (!exit && rbeforeProcess) {
						rbeforeProcess.on('exit', () => {
							rbeforeProcess = cp();

							next();
						});

						kill(rbeforeProcess);
					} else {
						rbeforeProcess = cp();

						next();
					}
				}, wait);

				watcher.onBefore(fn);
			}

			if (opitons.watchOpitons.rafter) {
				// 替换后执行命令
				const command = opitons.watchOpitons.rafter;
				// 子进程是否退出
				let exit = false;

				// 创建进程
				const cp = () => {
					exit = false;
					return createProcess(
						command,
						() => {
							rafterProcess = null;
							exit = true;
						},
						opitons.watchOpitons?.rafterEnv,
						opitons.watchOpitons?.rafterCwd
					);
				};

				// 是否要在初始化时执行 rafter
				if (immediate.rafterImmediate) rafterProcess = cp();

				// 防抖处理
				const fn = debounce((next: Function) => {
					if (!exit && rafterProcess) {
						rafterProcess.on('exit', () => {
							rafterProcess = cp();

							next();
						});

						kill(rafterProcess);
					} else {
						rafterProcess = cp();

						next();
					}
				}, wait);

				watcher.onAfter(fn);
			}

			process.on('exit', () => {
				if (rbeforeProcess) kill(rbeforeProcess);
				if (rafterProcess) kill(rafterProcess);
			});
		}

		replace(replaceOptions);
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
