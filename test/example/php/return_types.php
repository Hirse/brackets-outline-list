<?php
function getSomeThing(): Thing {
    return true ? something : somethingelse;
}

class Finder {
    public function getSomeThing(): Thing {}
}
