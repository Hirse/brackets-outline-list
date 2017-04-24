<?php
require_once("class.function/\"extends\".'interface'");
$str2 = 'class "function"\'extends interface\'';
$command = `class function \`extends\` interface`;

$multi_line = '
function myFunc () {
    return;
}
';
