import { ChildProcess } from 'child_process';
import treeKill from 'tree-kill';

/**
 * 结束进程
 */
export function kill(child: ChildProcess, callback?: (err?: Error) => void) {
	if (!callback) {
		callback = () => {};
	}

	if (child.pid) {
		treeKill(child.pid, callback);
	} else {
		try {
			child.kill('SIGKILL');
			callback();
		} catch (e) {
			callback(e as Error);
		}
	}
}
