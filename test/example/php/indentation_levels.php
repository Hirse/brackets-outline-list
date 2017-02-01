<?php
function a() {}

class MyClass {
    function b() {
        function c() {
            $closure = function(&$val) {
                $val = utf8_encode($val);
            };
        }
    }
    function d() {}
}
