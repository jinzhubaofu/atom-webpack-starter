<?php /* template for page entry */ ?>
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlentities($data['title'])?></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="x5-orientation" content="portrait">
</head>
<body>
<div [atom-root]>
<?php echo $atom['html'] ?>
</div>
</body>
</html>
