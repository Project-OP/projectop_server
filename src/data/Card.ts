export class Color{
    public static Spades = new Color("Spades","S",0);
    public static Hearts = new Color("Hearts","H",0);
    public static Clubs = new Color("Clubs","C",0);
    public static Diamonds = new Color("Diamonds","C",0);
    name: string;
    num: number;
    short: string;
        
    constructor(name: string, short:string, num: number){
        this.name = name;
        this.num = num;
        this.short = short;

    }
    public static All(){
        return [Color.Spades,Color.Hearts,Color.Diamonds,Color.Clubs];
    }
 
}
export class Value{
    public static v_2       =   new Value("2","2",2);
    public static v_3       =   new Value("3","3",3);
    public static v_4       =   new Value("4","4",4);
    public static v_5       =   new Value("5","5",5);
    public static v_6       =   new Value("6","6",6);
    public static v_7       =   new Value("7","7",7);
    public static v_8       =   new Value("8","8",8);
    public static v_9       =   new Value("9","9",9);
    public static v_10      =   new Value("10","10",10);
    public static v_J       =   new Value("Jack","J",11);
    public static v_Q       =   new Value("Queen","Q",12);
    public static v_K       =   new Value("King","K",13);
    public static v_A       =   new Value("Ace","A",14,1);


    name: string;
    rank: number;
    short: string;
    alt: number;
        
    constructor(name: string, short:string, rank: number, alt?:number){
        this.name = name;
        this.rank = rank;
        this.short = short;
        this.alt = rank;
        if (alt){
            this.alt = 1;
        }
        

    }

    public static All(){
        return [Value.v_2,Value.v_3,Value.v_4,Value.v_5,Value.v_6,Value.v_7,Value.v_8,Value.v_9,Value.v_10,Value.v_J,Value.v_Q,Value.v_K,Value.v_A];
    }

    toString():string {
        return this.name;
    }
}


export class Card{
    
    public static Empty = new Card(Color.Clubs,Value.v_10);
    color: Color;
    value: Value;
    visible: boolean;
    hasWon = false;
    
    constructor(color: Color, value: Value){
        this.color = color;
        this.value = value;
        this.visible = false;
        this.hasWon = false;
    }
    
    
    ValueAsInt(acelow = false): number{
        if (acelow){
            return this.value.alt;
        }else{
            return this.value.rank;
        }
    }
    toString():string {
        
        return this.color.short+this.value.short;
    }
    toJSON(): object {
        return {
            "c": this.color.short,
            "v": this.value.short
        };
    }

    static GetComparator(acelow = false):(a: Card,b: Card)=>number{
        
        return (a: Card,b: Card)=>{
            
            const va = a.ValueAsInt(acelow);
            const vb = b.ValueAsInt(acelow);
            
            return vb-va;
        }
    }



}

