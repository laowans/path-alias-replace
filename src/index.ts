import chalk from 'chalk';
import { Watch } from './watch';
import { kill } from './utils/kill';
import { debounce } from './utils/debounce';
import { Options, WatchOpitons } from '@type';
import { replace, ReplaceOptions } from './replace';
import { spawn, ChildProcess } from 'child_process';

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
function createProcess(command: string, exitCallback?: Function) {
	console.log(chalk.green(`run command  "${command}"`));

	return spawn(command, { stdio: 'inherit', shell: true }).on('exit', () => {
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
			if (opitons.watchOpitons.rbefore) {
				// 替换前执行命令
				const command = opitons.watchOpitons.rbefore;
				// 子进程是否退出
				let exit = false;

				// 创建进程
				const cp = () => {
					exit = false;
					return createProcess(command, () => {
						rbefore = null;
						exit = true;
					});
				};

				// 进程实例
				let rbefore: ChildProcess | null = cp();

				// 防抖处理
				const fn = debounce((next: Function) => {
					if (!exit && rbefore) {
						rbefore.on('exit', () => {
							rbefore = cp();

							next();
						});

						kill(rbefore);
					} else {
						rbefore = cp();

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
					return createProcess(command, () => {
						rafter = null;
						exit = true;
					});
				};

				// 进程实例
				let rafter: ChildProcess | null = cp();

				// 防抖处理
				const fn = debounce((next: Function) => {
					if (!exit && rafter) {
						rafter.on('exit', () => {
							rafter = cp();

							next();
						});

						kill(rafter);
					} else {
						rafter = cp();

						next();
					}
				}, wait);

				watcher.onAfter(fn);
			}
		}

		replace(replaceOptions);
	} else {
		replace(replaceOptions);
	}
}
