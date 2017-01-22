<?php
class Child implements IChild {
    public function speak() {}
}

class Child extends BaseChild {
    public function speak() {}
}

class Child extends BaseChild implements IChild {
    public function speak() {}
}
