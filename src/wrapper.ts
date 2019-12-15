export class Wrapper {
    static wrap(o: any, id: number) {
        if (id === undefined)
            o._id = o.id;
        else
            o._id = id;
        o.unwrap = () => {
            delete o._id;
            delete o.unwrap;
        };
        return o;
    }
}