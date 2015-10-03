package test;

class Test {
    
    var world : String = "World";
    
    static function main() {
        var lambda = function () {
        }
    }
    public function new() {
        Hello(world);
    }
    
    function Hello(name:String) {
        trace("Hello " + name + "!");
    }
    
    public function HelloPublic(name:String) {
        trace("Hello " + name + "!");
    }
    
}