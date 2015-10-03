package foo;
import haxe.foo;

class foo extends bar implements baz {
    typedef foo {}
    interface foo {}

    function new(){
    }

    //region foo
    //endregion
    var foo = function () {}
    function () {
    }
    var foo = function(bar:Baz) {}
    function foo(bar:Baz) {}
    override function foo(bar:Baz) {}
    static function foo() {}
    private function foo() {}
    public function foo() {}
    public static inline function foo() {}
    private static function foo() {}
    var foo:Bar = "baz";


    class Array<T> {
        function push(x : T) : Int;
    }

    @:generic static function method<T>(t:T) { }

    public static function equals<T> (expected:T, actual:T) {
        if (actual != expected) {
            trace('$actual should be $expected');
        }
    }

    enum Color {
        Red;
        Green;
        Blue;
        Rgb(r:Int, g:Int, b:Int);
    }

    @:generic
    static function make<T:Constructible>():T {
        return new T("foo");
    }

    /*
    * function new () 
    */

    // ignore this comment with the word class in it


}