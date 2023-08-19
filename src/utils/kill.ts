import { ChildProcess } from 'child_process';
import treeKill from 'tree-kill';

/**
 * 结束进程
 */
export function kill(child: ChildProcess): Promise<Error | undefined> {
	return new Promise((resolve) => {
		if (child.pid) {
			treeKill(child.pid, resolve);
		} else {
			try {
				child.kill('SIGKILL');
				resolve(void 0);
			} catch (e) {
				resolve(e as Error);
			}
		}
	});
}
