// Creamos un Servidor WEB con "EXPRESS" dentro de "JS", esto va a ser el motor de la Aplicación WEB, se va a encargar de recibir peticiones HTTP,
// de crear controladores, de tener disponibles rutas, Etc... todo esto para poder construir el servidio RESTFULL de la mejor manera posible a nivel
// de BackEnd.


// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'


// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Variable para cargar el módulo de Mongoose, nos va a servir para conectarnos a MongoDB para trabajar con la BDD dentro de nuestra API REST
var mongoose = require('mongoose');

// Cargamos la dependencia "colors" para poder manejar color de texto en la consola
var colors = require('colors');

// Cargamos el módulo "body-parser" que sirve para convertir los JSON (de las peticiones API)
// que nos llegan a un objeto JavaScript usables y funcionales
var bodyParser = require('body-parser');

// Nos va a permitir acceder a ficheros y a rutas de Archivos físicos que estén en nuestro Servidor
var path = require('path'); 


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente
// Aquí estamos definiendo el Servidor EXPRESS
var app = express();


// -- CONFIGURAR CABECERAS Y CORS -- (Para cualquier proyecto aplican las siguientes instrucciones, son las mismas)
// Creamos el Middleware para el CORS, es el acceso cruzado entre dominios, se configuran una serie de
// cabeceras para permitir peticiones AJAX de un dominio a otro, desde nuestro cliente hasta nuestra API
// Así nos evitamos problemas a la hora de hacer peticiones AJAX desde JavaScript, un FrontEnd, Etc.
app.use( ( req , res , next ) =>
{
    res.header('Access-Control-Allow-Origin','*');                              //Indica que cualquiera pueda acceder a estr origen
    res.header('Access-Control-Allow-Headers' , 'Authorization, X-API-KEY, Origin, X-Requested-With,Content-Type, Accept,Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods' , 'GET,POST,OPTIONS,PUT,DELETE'); //Métodos HTTP Permitidos
    res.header('Allow' , 'GET,POST,OPTIONS,PUT,DELETE');                        //En la regla "allow" se pasan nuevamente los métodos anteriores

    next();
});



// ++++ CARGAR RUTAS ++++
// Cargamos el módulo de configuración de rutas que creamos en la carpeta de "rutas" en el archivo "app.js"
var rutaPrincipal   = require('./Rutas/app');       // Esta es la ruta principal
var usuario_Rutas   = require('./Rutas/usuario');   // Cargamos el módulo de configuración de rutas que creamos en la carpeta de "Rutas" en el archivo "usuario.js"
var hospital_Rutas  = require('./Rutas/hospital');  // Cargamos el módulo de configuración de rutas que creamos en la carpeta de "Rutas" en el archivo "hospital.js"
var medico_Rutas    = require('./Rutas/medico');    // Cargamos el módulo de configuración de rutas que creamos en la carpeta de "Rutas" en el archivo "medico.js"
var busqueda_Rutas  = require('./Rutas/busqueda');  // Cargamos el módulo de configuración de rutas que creamos en la carpeta de "Rutas" en el archivo "busqueda.js"
var login_Rutas     = require('./Rutas/login');     // Cargamos el módulo de configuración de login que creamos en la carpeta de "Rutas" en el archivo "login.js"
var upload_Rutas    = require('./Rutas/upload');    // Cargamos el módulo de configuración de rutas que creamos en la carpeta de "Rutas" en el archivo "upload.js"
var imagenes_Rutas  = require('./Rutas/imagenes');  // Cargamos el módulo de configuración de Imagenes que creamos en la carpeta de "Rutas" en el archivo "imagenes.js"



//-- MIDDLEWARE DE BODY-PARSER 
// ¡¡¡ NOTA !!!.- Este apartado del BODY-PARSER debe ir antes del apartado de "RUTAS BASE" de lo contrario no funcionará !!!
// Son funciones, métodos que se ejecutan en primer lugar cuando se ejecutan peticiones HTTP, antes de que llegue a un controlador) --
// Si hay algo en el BODY que nosotros estémos enviando el BODY-PARSER lo va a tomar y nos va a crear el objeto de JavaScript para que
// lo podamos utilizar en cualquier lugar
app.use( bodyParser.urlencoded( { extended:false } ) )  //Creamos el middleware
app.use( bodyParser.json() );                           //Lo que traiga el body lo convertimos a JSON para poder usarlo dentro de nuestro código



// -- SERVER INDEX CONFIG  (Esto se comenta ya que se considera que su uso vulneral a segurodad de la aplicación)
// var serveIndex = require('serve-index');
// app.use(express.static(__dirname + '/'))
// app.use('/uploads', serveIndex(__dirname + '/uploads'));


// -- RUTAS BASE
// Aquí cargamos la configuración de rutas
/*  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
// "app.use"    = Nos permite hacer middleware, es decir, en cada petción que se haga el middleware siempre se va a ejecutar antes de llegar a la acción del controlador
//              El middleware es algo que se ejecuta antes de que se resuelvan otras rutas


app.use('/' , express.static( 'client' , { redirect: false } ) );
// "usuario_Rutas"  = Ruta para los "Usuarios"
app.use('/usuario' , usuario_Rutas );
// "hospital_Rutas" = Ruta para los "Hospitales"
app.use('/hospital' , hospital_Rutas );
// "medico_Rutas"   = Ruta para los "Medicos"
app.use('/medico' , medico_Rutas );
// "busqueda_Rutas"  = Ruta para los la búsqueda General
app.use('/busqueda' , busqueda_Rutas );
// "login_Rutas"    = Ruta para el "Login"
app.use('/login' , login_Rutas );
// "upload_Rutas"   = Ruta para el "upload"
app.use('/upload' , upload_Rutas );
// "imagenes_Rutas"   = Ruta para las "imagenes"
app.use('/img' , imagenes_Rutas );

app.get('*' , function( req , res , next) {
    res.sendFile( path.resolve('client/index.html') );
});

// ¡¡¡ OJO!!!.- Esta línea de código debe de ir al final, si la ponemos antes de otras rutas entonces siempre se estará llamando a esta ruta y no entrarán las que estén debajo de ella
// "/"              = Es la ruta principal
// "rutaPrincipal"  = Ruta Principal, se activa cuando cualquier petición haga match con la pleca (/)
// app.use('/',rutaPrincipal);
/* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */



// -- ESCUCHAR PETICIONES
// Esto se logra a trravez del puerto 3000 (si ese puerto ya está ocupado se puede usar el 3001,8080 o cualquier otro) y a parte ponemos un mensaje para saber si el Servidor
// se logró levantar o si sucedió un error 8eso lo hacemos con una función de flecha
app.listen( 3000 , ()=>
{
    console.log('Express Server Puerto 3000:' , 'online'.bgGreen );
});


// ++++ CONEXIÓN A LA BDD ++++
// "mongoose"               = Hace referencia a la librrería de MONGOOSE
// "mongodb:"               = Indicamos que trabajamos con una BDD de MONGODB
// "//localhost:27017"      = Es el puerto por default de MongoDB, eso lo configuramos en Robo 3T, y su valor lo vemos al ejecutar el MONGOD
// "//hospitalDB"           = Es nuestra Base de Datos, la creamos en Robo 3T, si la BDD no existe entonces se crea
// "{useNewUrlParser:true}" = Es una nueva versión del analizador de cadenas, aún no es obligatorio pero ya lo podemos usar y nos evitamos un mensaje de advertencia
//                            que aparece en la ventana del CMD cuando hace la conexión a la BDD
mongoose.connect('mongodb://localhost:27017/hospitalDB' , { useNewUrlParser: true })
    // Todo OK, Node logró la conexión con la BDD de MONGO
    .then( () =>
    {
        console.log('Base de Datos:' , 'online'.bgMagenta);
    })
    
    // Sucedió un error, "throw" detiene todo el proceso, detenemos la aplicación por completo
    .catch( () =>
    {
        console.error( err );
    });

// Con la siguiente instrucción eliminamos el warning que aparece en la consola: DeprecationWarning: collection.ensureIndex is deprecated. Use ctrateIndexes instead"
mongoose.set('useCreateIndex' , true);