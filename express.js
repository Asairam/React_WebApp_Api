var express=require("express");
var mysql=require("my-sql");
var bodyParser=require("body-parser");
var uniqid = require('uniqid');
var fileUpload = require('express-fileupload')
var fs = require('fs');
var path = require('path');
var app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(fileUpload());


var conn=mysql.createConnection({
	host:"localhost",
	user:"root",
	password:"",
	database:"react_webapp"
});
conn.connect();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


// signup
app.post("/api/signup",function(req,res){
	var recored = JSON.parse(req.body.userdata);
	var today = new Date();
	var users={
        "Id": uniqid(),
        "IsDeleted":0,
        "FirstName":recored.fname,
        "LastName":recored.lname,
        "Phone":recored.phone,
		"Email":recored.email,
		"Birthdate":recored.bday,
		"CreatedDate":today,
		"LastModifiedDate":today,
		"Gender__c":recored.gender,
		"Pin__c":recored.pin,
		"Password":recored.password,
		"Old_Password":recored.oldpassword,
		"Address":recored.address,
	    "User_Name":recored.username
    }
	var uservalid = "select User_Name,Password from contact__c where User_Name = '" + recored.username +"' and Password = " + recored.password;
    conn.query(uservalid,function(err,record){
     if (err) {
			res.json({
				status:false,
				message:'there are some error with (uservalid) query'
			})
	 } else {
		  if (record.length !== 0) {
			 res.json({
				status:false,
				message:'user alredy registered'
			 })
		 } else {
				conn.query("INSERT INTO contact__c SET ?",users,function(error,results){
					   if (error) {
							res.json({
								status:false,
								message:'there are some error with signup insert query'
							})
						  }else{
							  res.json({
								status:true,
								data:results,
								message:'user registered sucessfully'
							})
						  }
				});
		 }
	 }
	});
});

// login
app.post("/api/login",function(req,res) {
	var loginRec = JSON.parse(req.body.userdata);
   var sqlquery = 'select * from contact__c where User_Name = "' + loginRec.uname +'" and Password = '+ loginRec.pwd;
   conn.query(sqlquery ,function (error, results) {
	if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
	  }else{
		  if (results.length > 0) {
            res.json({
				status:true,
				data:results[0],
				message:'user login sucessfully'
			})
		  } else {
			   res.json({
				status:false,
				data:results,
				message:'invalid user name'
			})
		  }
	  }
  });
});

// profile update
app.post("/api/profile/update",function(req,res){
	var updateRec = JSON.parse(req.body.userdata);
	var today = new Date();
	var upadteQuery = 'update contact__c set FirstName = "'+ updateRec.fname 
	                   +'", LastName = "'+ updateRec.lname 
					   +'", Email = "'+ updateRec.email
					   +'", Phone = "'+ updateRec.phone 
					   +'", LastModifiedDate = "'+ today
					   +'", Address = "'+ updateRec.address 
					    +'" where Id ="' + updateRec.id +'"';
	conn.query(upadteQuery,function(error,result){
		if (error) {
			res.json({
				status:false,
				message:'there are some error with profile update query'
			})
		  }else{
			  var sqlquery = 'select * from contact__c where Id = "' + updateRec.id + '"';
			  conn.query(sqlquery,function(err,records){
						if (err) {
							res.json({
								status:false,
								message:'there are some error with profile update data query'
							})
						} else {
                             res.json({
								status:true,
								data:records[0],
								message:'profile update sucessfully'
							})
						}
				})
		  }
	});
});

/** profile pic upload */
app.post("/api/profile_pic/upload/:id",function(req,res){
	let sampleFile = req.files.myImage;
	let olduploadPath = __dirname + '/uploads/profile_img/' + sampleFile.name;
	let newuploadPath = __dirname + '/uploads/profile_img/' + req.params.id + '.jpg';
	if (fs.existsSync(newuploadPath)) {
		fs.rename(olduploadPath, newuploadPath, function(err) {
            if ( err ) {return;}
       });
	}

	sampleFile.mv(newuploadPath, function(err) {
	    if (err) {
			res.json({
				status:false,
				message:'there are some error with profile photo upload'
			})
		} else {
				res.json({
					status:true,
					message:'File uploaded!'
			   })
		}
  });
});

app.get("/app",function(req,res){
	conn.query("select * from example",function(err,records,fields){
			res.send(records)
	})
});

//insert new emp data
app.post("/appPost",function(req,res){
	var today = new Date();
	var users={
        "name":req.body.username,
        "email":req.body.useremail,
        "number":req.body.usernum,
        "created_at":today,
        "updated_at":today
    }
	
	conn.query('INSERT INTO example SET ?',users,function(error, results, fields){
		if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:results,
				message:'user registered sucessfully'
			})
		  }
	})
});

// Search Api
//rest api to get a single employee data
app.get('/employe/:id', function (req, res) {
	conn.query('select * from example where id=?', [req.params.id], function (error, results, fields) {
	if (error) throw error;
	res.end(JSON.stringify(results));
  });
 });

// or
app.post('/employe1', function (req, res) {
	conn.query(`select * from example where name='${req.body.name}' or id=${req.body.id}`,function (error, results, fields) {
	if (error) throw error;
	res.end(JSON.stringify(results));
  });
 });

// and
app.post('/employe2', function (req, res) {
	conn.query(`select * from example where name='${req.body.name}' and id=${req.body.id}`,function (error, results, fields) {
	if (error) throw error;
	res.end(JSON.stringify(results));
  });
 });

// params 
app.get('/employe3/:id/:name', function (req, res) {
	conn.query(`select * from example where name='${req.params.name}' or id=${req.params.id}`,function (error, results, fields) {
	if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:results,
				message:'user Search sucessfully'
			})
		  }
  });
 });



//update emp data (using put)
app.put("/empUpdate/:id",function(req,res){
	conn.query(`update example set name='${req.body.uname}',email='${req.body.uemail}' where id='${req.params.id}'`,function(error, results, fields){
		if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:results,
				message:'user update sucessfully'
			})
		  }
	})
});


//delete emp data (using delete)
app.delete("/empDele/:id",function(req,res){
	conn.query(`delete from example where id=${req.params.id}`,function(error,results){
     if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:results,
				message:'user delete sucessfully'
			})
		  }
	})
})


app.post("/empIn",function(req,res){
	var empdata=[
	  ['fdg', 4354,'gdg'],
	  ['rtre',1543549004,'rettrret'],
	  ['rtet',  4355,'retre'],
	  ['dfgf', 435,'ios'],
	  ['ertre', 2222,'andfgfdo'],
	  ['wreer', 3343,'andfgfdo'],
	  ['werwer', 343,'sdf'],
	  ['ertsdfdsfre', 4353,'andfgfdo'],
	  ['sdfsd', 3243,'fsdf'],
	  ['rsdfs', 3434,'andfgfdo'],
	  ['sf', 3434,'sdf']
	]
	conn.query(`insert into emp (ename,esalary,position) VALUES ?`,[empdata],function(error,results){
		if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:results,
				message:'user registered sucessfully'
			})
		  }
	})
});

//join query
app.get("/empGet",function(req,res){
	var join='select example.id,example.name,example.email,emp.esalary,emp.position from example Join emp on example.id=emp.id';

	conn.query(join,function(error,results){
		if (error) throw error;
	res.end(JSON.stringify(results));
	});
});

//Aliases
app.get("/empAli",function(req,res){
	var ali='select name as username from example';
	conn.query(ali,function(error,results){
		if(error) throw error;
		res.end(JSON.stringify(results));
	});
});

// INNER JOIN
app.get("/empInner",function(req,res){
	var inner="select emp.id,emp.ename,example.email,example.number from emp inner join example on emp.id=example.id";

	conn.query(inner,function(error,records,fields){
         if(error) throw error;
		res.end(JSON.stringify(records));
	})
});

//LIKE
app.get("/empLike/:name",function(req,res){
	var like=`select * from emp where ename like '${req.params.name}%'`;

	conn.query(like,function(error,records,fields){
         if(error) throw error;
		res.end(JSON.stringify(records));
	})
});

//NOT starting with "b", "s", or "p":
app.get("/empStart/:name",function(req,res){
	var like=`select * from emp where ename not like '[${req.params.name}]%'`;

	conn.query(like,function(error,records,fields){
         if(error) throw error;
		res.end(JSON.stringify(records));
	})
});

//BETWEEN
app.get("/empBet/:name",function(req,res){
	  var resname=req.params.name;
	  var ressplit=resname.split("-");
	var BETWEEN=`select * from emp where esalary BETWEEN ${ressplit[0]} and ${ressplit[1]} `;

	conn.query(BETWEEN,function(error,records,fields){
         if(error) throw error;
		res.end(JSON.stringify(records));
	})
});

// min salary
app.get("/empMin/:salary",function(req,res){
	  var ressalary=req.params.salary;
	var salary=`select * from emp where esalary < ${ressalary} `;

	conn.query(salary,function(error,records,fields){
         if(error) throw error;
		res.end(JSON.stringify(records));
	})
});

// secound highest salary
app.get("/empHigh/:salary",function(req,res){
	  var ressalary=req.params.salary;
	var salary=`select max(esalary) as secound_highest_salary from emp where esalary < ${ressalary}`;

	conn.query(salary,function(error,records,fields){
        if (error) {
			res.json({
				status:false,
				message:'there are some error with query'
			})
		  }else{
			  
			  res.json({
				status:true,
				data:records,
				message:'user secound highest salary'
			})
		  }
	})
});


// login example
app.post("/login",function(req,res){
	var uname=req.body.uname;
	var uemail=req.body.uemail;
	var uservalid=`select * from example where name='${uname}' and email='${uemail}'`;
	conn.query(uservalid,function(error,records){
		if(error){
			res.json({
				status:false,
				message:'there are some error with query'
			})
		}else{
				if(records==''){
						res.json({
							status:false,
							message:'user invalid'
					   })
				 }else{
				 	   conn.query('select * from emp',function(error,records){
                             if(error){
                             	res.json({
                             		status:false,
                             		message:'emp data getting unsuccessfully'
                             	})
                             }else{
                             	res.json({
									status:true,
									message:'user login sucessfully',
									data:records
								})
                             }
				 	   });
						
			     }
		}
	})
});

// add items in data base (only new item not in old items)

app.post("/itemAdd/:name",function(req,res){
	conn.query(`select * from emp where ename='${req.params.name}'`,function(error,results){
		if(error){
			res.json({
				status:false,
				message:'there are some error with query'
			})
		}else{
			if(results==''){
				var file = req.files.uploaded_image;
		         var img_name=file.name;
		         if(req.body.usalary == null){
		         	req.body.usalary='';
		         }
				var values={
					"ename":req.params.name,
					"esalary":req.body.usalary,
					"file":img_name
				};

			      conn.query(`insert into emp set ?`,values,function(error,records){
				      	if(error){
				      		res.json({
								status:error,
								message:'insert failed'
							})
				      	}
				      	else{
				      		res.json({
								status:true,
								message:'insert sucessfully',
								data:records
							})
				      	}
			      })
			}else{
				res.json({
					status:false,
					message:'user already available'
				})
			}
		}
	})
});





app.listen(8080);
console.log("server listening the port number 8080");