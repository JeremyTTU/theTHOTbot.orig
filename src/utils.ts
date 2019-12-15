export default class Utils {
    static SimplePropertyRetriever = {
        getOwnEnumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, false, this._enumerable);
            // Or could use for..in filtered with hasOwnProperty or just this: return Object.keys(obj);
        },
        getOwnNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, false, this._notEnumerable);
        },
        getOwnEnumerablesAndNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, false, this._enumerableAndNotEnumerable);
            // Or just use: return Object.getOwnPropertyNames(obj);
        },
        getPrototypeEnumerables: function (obj: any) {
            return this._getPropertyNames(obj, false, true, this._enumerable);
        },
        getPrototypeNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, false, true, this._notEnumerable);
        },
        getPrototypeEnumerablesAndNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, false, true, this._enumerableAndNotEnumerable);
        },
        getOwnAndPrototypeEnumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, true, this._enumerable);
            // Or could use unfiltered for..in
        },
        getOwnAndPrototypeNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, true, this._notEnumerable);
        },
        getOwnAndPrototypeEnumerablesAndNonenumerables: function (obj: any) {
            return this._getPropertyNames(obj, true, true, this._enumerableAndNotEnumerable);
        },
        // Private static property checker callbacks
        _enumerable: function (obj: any, prop: any) {
            return obj.propertyIsEnumerable(prop);
        },
        _notEnumerable: function (obj: any, prop: any) {
            return !obj.propertyIsEnumerable(prop);
        },
        _enumerableAndNotEnumerable: function (obj: any, prop: any) {
            return true;
        },
        // Inspired by http://stackoverflow.com/a/8024294/271577
        _getPropertyNames: function getAllPropertyNames(obj: any, iterateSelfBool: any, iteratePrototypeBool: any, includePropCb: any) {
            var props = [];

            do {
                if (iterateSelfBool) {
                    Object.getOwnPropertyNames(obj).forEach(function (prop) {
                        if (props.indexOf(prop) === -1 && includePropCb(obj, prop)) {
                            props.push(prop);
                        }
                    });
                }
                if (!iteratePrototypeBool) {
                    break;
                }
                iterateSelfBool = true;
            } while (obj = Object.getPrototypeOf(obj));

            return props;
        }
    };
}