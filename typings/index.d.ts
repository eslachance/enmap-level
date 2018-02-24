declare module 'enmap-level' {

	import { Level } from 'native-level-promise';

	export class EnmapLevel<K, V> {
		public constructor(options: EnmapLevelOptions);
		public features: {
			multiProcess: false;
			complexTypes: false;
			keys: 'single';
		};
		public name: string;
		public dataDir: string;
		public path: string;
		public db: Level;
		private defer: Promise;

		public init(enmap: Map): Promise;
		public close(): void;
		public set(key: K, value: V): void;
		public setAsync(key: K, value: V): Promise<void>;
		public delete(key: K): void;
		public deleteAsync(key: K): Promise<void>;
		private ready(): void;
		private validateName(): void;
	}

	export type EnmapLevelOptions = {
		name: string;
		dataDir: string;
	};

}
