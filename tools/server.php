<?php

//显示除去 E_NOTICE 之外的所有错误信息
error_reporting(E_ALL ^ E_NOTICE);

require_once(__DIR__ . "/../node_modules/vip-server-renderer/php/server/Atom.class.php");
require_once(__DIR__.'/AtomWrapper.class.php');

$root = __DIR__ . "/..";
$request = $_SERVER['REQUEST_URI'];

$component = "Home/index.atom.php";
$template = "$root/output/template";

$atomWrapper = new AtomWrapper();

$atomWrapper->setTemplateDir($template);
$atomWrapper->display("Home/index.template.php", "$component");
