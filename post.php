<?php 
	if(isset($_POST) && !empty($_POST)) {
		echo "POST values : \n";
		var_dump($_POST); 
	} else {
		echo "POST value empty !";
	}
?>