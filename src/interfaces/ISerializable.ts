interface ISerializable<T>{
    SetData(data: T);
    GetData(): T;
}