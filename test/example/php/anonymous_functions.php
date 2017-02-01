<?php
array_walk_recursive($array, function(&$val) {
    $val = utf8_encode($val);
});

function myFunc() {
    $closure = function(&$val) {
        $val = utf8_encode($val);
    };
}

class MyClass {
    function myFunc2() {
        array_walk_recursive($array, function(&$val) {
            $val = utf8_encode($val);
        });
    }

    function myFunc3() {}
}
