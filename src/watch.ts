import path from 'path';
import chalk from 'chalk';
import chokidar, { FSWatcher } from 'chokidar';
import { kill } from './utils/kill';
import { WatchOpitons } from '@type';
import { spawn, ChildProcess, ProcessEnvOptions } from 'child_process';

/**
 * 监控类
 */
export class Watch {
	constructor(watchPath: string, opitons: WatchOpitons, replaceFn: Function) {
		this.watchPath = watchPath;
		this.opitons = opitons;
		this.replaceFn = replaceFn;

		this.rbeforeBool = Boolean(opitons.rbefore);
		this.rafterBool = Boolean(opitons.rafter);

		this.start();
	}

	/**
	 * 监控目录
	 */
	readonly watchPath: string;
	/**
	 * 监控配置项
	 */
	readonly opitons: WatchOpitons;

	/**
	 * 监控实例
	 */
	private FSWatcher: FSWatcher | null = null;
	/**
	 * 替换方法
	 */
	private replaceFn: Function;
	/**
	 * 防抖延时
	 */
	private wait = 300;
	/**
	 * 定时器实例
	 */
	private timeout?: NodeJS.Timeout;
	/**
	 * 是否启用 rbefore
	 */
	private rbeforeBool = false;
	/**
	 * 是否启用 rafter
	 */
	private rafterBool = false;
	/**
	 * rbefore 进程实例
	 */
	private rbeforeProcess: ChildProcess | null = null;
	/**
	 * rafter 进程实例
	 */
	private rafterProcess: ChildProcess | null = null;

	/**
	 * 开始监控
	 */
	start() {
		this.FSWatcher = chokidar
			.watch(this.watchPath, {
				persistent: true,
				ignored: this.opitons.ignored,
			})
			.on('ready', () => {
				this.bingEvents();

				this.debounce(true);

				console.log(chalk.magenta(`start watch "${this.watchPath}"`));

				if (this.opitons['/r']) {
					// 监控终端 "/r" 的输入
					process.stdin.setEncoding('utf8').on('data', (data) => {
						let str: string;

						if (Buffer.isBuffer(data)) {
							str = data.toString();
						} else {
							str = data;
						}
						// 当监控到 "/r" 的输入重新执行 debounce 方法
						if (str.trim() === '/r') {
							console.log(chalk.magenta('restart'));

							this.debounce();
						}
					});
				}
			});
	}
	/**
	 * 停止监控
	 */
	stop() {
		if (this.FSWatcher) {
			this.FSWatcher.close();
			this.FSWatcher = null;
		}
	}
	/**
	 * 绑定事件
	 */
	private bingEvents() {
		if (this.FSWatcher) {
			this.FSWatcher.on('all', (eventName, path) => {
				this.changeCallback(eventName, path);
			});
		}
	}
	/**
	 * 变化回调
	 */
	private changeCallback(type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', _path: string) {
		this.debounce();

		if (this.opitons.outputMsg) {
			// 输出信息
			let prefix = '';

			switch (type) {
				case 'add':
				case 'addDir':
					prefix = chalk.greenBright(type.padEnd(11, ' '));
					break;
				case 'change':
					prefix = chalk.blueBright(type.padEnd(11, ' '));
					break;
				case 'unlink':
				case 'unlinkDir':
					prefix = chalk.redBright(type.padEnd(11, ' '));
					break;
			}

			console.log(prefix + chalk.green(path.relative(this.watchPath, _path).replace(/\\/g, '/')));
		}
	}
	/**
	 * 防抖
	 */
	private async debounce(immediate = false) {
		clearTimeout(this.timeout);

		try {
			if (this.rbeforeBool && this.rbeforeProcess) {
				await kill(this.rbeforeProcess);
			}

			if (this.rafterBool && this.rafterProcess) {
				await kill(this.rafterProcess);
			}
		} catch (error) {
			console.error(error);
		}

		this.timeout = setTimeout(() => {
			this.create_rbefore(() => {
				this.replaceFn();

				this.create_rafter(immediate);
			}, immediate);
		}, this.wait);
	}
	/**
	 * 创建进程
	 */
	private createProcess(
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
	 * 创建 rbefore
	 */
	private create_rbefore(next: Function, immediate: boolean) {
		if (this.rbeforeBool) {
			if (immediate && !this.opitons.rbeforeImmediate) {
				return next();
			}

			this.rbeforeProcess = this.createProcess(
				this.opitons.rbefore as string,
				() => {
					this.rbeforeProcess = null;
				},
				this.opitons.rbeforeEnv,
				this.opitons.rbeforeCwd
			);

			next();
		} else {
			next();
		}
	}
	/**
	 * 创建 rafter
	 */
	private create_rafter(immediate: boolean) {
		if (this.rafterBool) {
			if (immediate && !this.opitons.rafterImmediate) {
				return;
			}

			this.rafterProcess = this.createProcess(
				this.opitons.rafter as string,
				() => {
					this.rafterProcess = null;
				},
				this.opitons.rafterEnv,
				this.opitons.rafterCwd
			);
		}
	}
}
