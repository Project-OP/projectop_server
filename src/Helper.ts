export class Helper{
    /**
     * Shuffles array in place. ES6 version
     * @param {Array} a items An array containing the items.
     */
    static shuffle(a: Array<any>){
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    static Permutations(a: Array<any>) {
        const ret = [];
      
        for (let i = 0; i < a.length; i++) {
          const rest = this.Permutations(a.slice(0, i).concat(a.slice(i + 1)));
      
          if(!rest.length) {
            ret.push([a[i]])
          } else {
            for(let j = 0; j < rest.length; j = j + 1) {
              ret.push([a[i]].concat(rest[j]))
            }
          }
        }
        return ret;
      }

    
    static generateUIDWithCollisionChecking(activeList: any) {
        while (true) {
            var uid = ("0000" + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)).slice(-4);
            if (!activeList.hasOwnProperty(uid)) {
                
                return uid;
            }
        }
    }
    static size(obj: any){
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    static prettifyTimeDelta(ms: number){
        
        var d, h, m, s;
        s = Math.floor(ms / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;
        
        var minutes = "0" + m;
            
        var seconds = "0" + s;
        
        var formattedTime = h + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        return { d: d, h: h, m: m, s: s,str:formattedTime };
        
    }
    static GetRelativeRingIndex(index: number, offset: number, array:Array<any>){
        function mod(n: number, m: number): number {
            return ((n % m) + m) % m;
        }
        
        return mod(index + offset, array.length);
        
    }
    static Modulo(index: number, modulator: number){
        function mod(n: number, m: number): number {
            return ((n % m) + m) % m;
        }
        const i = mod(index, modulator);
        return i;
        
    }

    static GroupBy(xs, key) {
        return xs.reduce(function(rv, x) {
          const elem = (rv[x[key]] = rv[x[key]] || [])
          elem.push(x);
          return rv;
        }, {});
      };

    /**
     * 
     * @param from_inclusive positive int 
     * @param to_inclusive positive int
     */
    static RandInt(from_inclusive, to_inclusive: number): number{
        const min = Math.ceil(from_inclusive);
        const max = Math.floor(to_inclusive)+1;
        return Math.floor(Math.random() * (max - min)) + min;

    }
    
}


