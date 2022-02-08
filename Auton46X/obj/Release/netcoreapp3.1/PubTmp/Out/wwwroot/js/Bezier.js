
//Makes an array of Vectors that can be efficiently modified at both ends
class VectorArr {
    arr = [];

    //Constructor
    constructor(list){
        this.arr = list;
    }


    ////Bracket access
    //decltype(arr.getCurrent()) getCurrent(){
    //    return arr.getCurrent();
    //}
    //void popCurrent(){
    //    arr.popCurrent();
    //}
    //void popCurrentNext(){
    //    arr.popCurrentNext();
    //}
    //void popBase(){
    //    arr.popBase();
    //}
    //void popEnd(){
    //    arr.popEnd();
    //}
    //Get the size
    size(){
        return this.arr.length;
    }
    //Add elements
    push(v){
        this.arr.push(v);
    }
    push_front(v){
        this.arr.unshift(v);
    }
    last() {
        return this.arr[this.arr.length - 1];
    }
    [Symbol.iterator]() {
        return this;
    }
    i = 0;
    next() {

        var ret = {
            done: this.i == this.arr.length,
            value: this.arr[this.i]
        };
        this.i++;
        return ret;
    }

};

//Find a single point on a bezier curve with parameter t (t goes from 0 -> 1)
function bezierInterpolate(ptArr, t){
    //The array of the interpolated points
    var newPts = new VectorArr([]);
    for (var i = 0; i < ptArr.size() - 1; i++) {
        //Interpolate between current point and next
        var newPt = p5.Vector.lerp(ptArr.arr[i], ptArr.arr[i + 1], t);
        newPts.push(newPt);
    }
    //If interpolated point array still has multiple elements
    if (newPts.size() >= 2) {
        //YAYYY RECURSION!!!!
        return bezierInterpolate(newPts, t);
    } else {
        //Otherwise return the only element
        return newPts.arr[0];
    }
}
//Create a bezier curve
function bezierCurve(ptArr, inc = 1.0 / 50.0){
    var spacing = 1.0;
    //Return value
    var ret = new VectorArr([]);
    //Go through multiple rounds of interpolation
    for (var i = 0; i < 1; i += inc) {
        var pt = bezierInterpolate(ptArr, i);
        ret.push(pt);
    }
    ret.push(ptArr.last());
    var lastSafe = ret.arr[0];
    var isSafe = true;
    for (var i = 0; i < ret.length; i++) {
        var g = arr[i];
        if (!isSafe) {
            if (g.dist2D(lastSafe) < spacing) {
                //ret.popCurrent();
            }
            else {
                //lastSafe = ret.arr.splice(i, 1);
            }
        } else {
            isSafe = false;
        }
    }
    return ret;
}