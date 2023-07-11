export namespace main {
	
	export class Update {
	    currentVersion: string;
	    latestVersion: string;
	    name: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Update(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}

}

