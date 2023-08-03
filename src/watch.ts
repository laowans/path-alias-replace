import path from 'path';
import chalk from 'chalk';
import { WatchOpitons } from '@type';
import chokidar, { FSWatcher } from 'chokidar';

interface WatchEvnt {
	before?: Function;
	on?: Function;
	after?: Function;
}

/**
 * 监控类
 */
export class Watch {
	constructor(watchPath: string, opitons: WatchOpitons) {
		this.watchPath = watchPath;
		this.opitons = opitons;

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
	 * 事件
	 */
	private event: WatchEvnt = {};
	/**
	 * 是否在运行事件
	 */
	private running = false;

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
			});
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
		const runBefore = () => {
			if (this.event.before) {
				this.event.before(run);
			} else {
				run();
			}
		};
		const run = () => {
			if (this.event.on) {
				this.event.on(runAfter);
			} else {
				runAfter();
			}
		};
		const runAfter = () => {
			if (this.event.after) {
				this.event.after(() => {
					this.running = false;
				});
			} else {
				this.running = false;
			}
		};

		if (!this.running) {
			this.running = true;
			runBefore();

			if (this.opitons.outputMsg) {
				const msg = ['\t', chalk.green(path.relative(this.watchPath, _path).replace(/\\/g, '/'))];

				switch (type) {
					case 'add':
					case 'addDir':
						msg.unshift(chalk.greenBright(type));
						break;
					case 'change':
						msg.unshift(chalk.blueBright(type));
						break;
					case 'unlink':
					case 'unlinkDir':
						msg.unshift(chalk.redBright(type));
						break;
				}

				console.log(msg.join(''));
			}
		}
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

	// 绑定事件
	onBefore(fn: (next: Function) => void) {
		this.event.before = fn;
	}
	on(fn: (next: Function) => void) {
		this.event.on = fn;
	}
	onAfter(fn: (next: Function) => void) {
		this.event.after = fn;
	}
}
