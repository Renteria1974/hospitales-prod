// FICHERO PARA COMPROBAR QUE UN USUARIO EXISTE

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ SERVICIOS DE TERCEROS ++++
// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

var bcrypt = require('bcrypt'); // Cargamos el módulo "bcrypt", esto nos permite hacer un cifrado de passwords

// SERVICIO JWT
// Importar el módulo de JWT, las librerías JWT, para poder acceder a sus métodos
// Nos permite generar un token que será devuelto (en lugar de regresar los datos) cuando se ha logueado correctamente a un usuario
// JSON = Formato de texto Ligero de intercambio de datos basado en un subconjunto del Lenguaje de Programación JavaScript, es independiente del lenguaje que se utiliza
//      puede representar 4 tipos primitivos (cadenas, números, booleanos, valores nulos) y 2 estructurados (objetos y arreglos)
// JWT (JSON WEB TOKEN) = Conjunto de medios de seguridad para peticiones http para representar demandas para ser transferidos entre el cliente y el servidor. Es un
//       Contenedor de Información referente a la autenticación de un usuario. Las partes de un JWT se codifican como un objeto que está firmado digitalmente
//       utilizando JWS (JSON Web Signature)
var jwt = require('jsonwebtoken');


// ++++ MODELOS CREADOS POR NOSOTROS ++++
// Importamos el Esquema de Usuario que definimos en "Modelos/Usuario.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Usuario = require('../Modelos/usuario');


// ++++ SERVICIOS CREADOS POR NOSOTROS ++++


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();


// ++++ GOOGLE ++++
// Importamos el archivo "config.js" para poder usar la constante SEED
var SEED = require('../config/config').SEED;            // ".SEED" = Aquí mismo le damos el valor de la constante a la variable que estamos declarando
var CLIENT_ID = require('../config/config').CLIENT_ID;  // Importamos el archivo "config.js" para poder usar la constante CLIENT_ID
// Configuración tomada del Portal de GOOGLE-SIGN-INT
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);


// Middleaware de la autenticación del Token, ya tenemos la referencia a todas las funciones
var mdAutenticacion = require('../Middlewares/autenticacion');



// ================================================================================
// ++++ COMPROBAMOS QUE EL USUARIO EXISTE, ESTA ES LA AUTENTICACIÓN DE GOOGLE  ++++
// ================================================================================
// <<<<<< Método que nos devuelve una promesa. Incorpora las funciones NSYNC y AWAIT del ECMAScript7. Regresa un usuario de Google 
            // o un error en caso de que el token sea inválido >>>>>>
// "async"      = Nos retorna una "promesa", es decir, vamos a poder hacer un "then" y un "catch"
// "token"      = Es el token que genera Google, el que generamos en el proyectito "google-signin-demo"
// "CLIENT_ID"  = Es el valor del Cliente de Google que tomamos del portal de GOOGLE-SIGN-IN
async function verify( token )
{
    // "await"  = Indica que "client.verifyIdToken" es función que retora una promesa y lo que le dice a nuestra función "async"
    //          es que espera hasta que "verifyIdToken" resuelva y lo que sea que retorne lo va a grabar en la constante "ticket"    
    const ticket = await client.verifyIdToken({
        idToken: token,    
        audience: CLIENT_ID,
    });

    // Guardamos toda la información del usuario
    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    
    // Retornamos a detalle la información del usuario de Google, esos datos son lo que registramos cuando dimos de alta dicha cuenta de Email,
    // NO existe un campo "apellido" ni tampoco "role"
    return {
        nombre: payload.name,
        email:  payload.email,
        img:    payload.picture,
        google: true
    }    
}



// ==============================================================================================================
// <<<<<< Método validar el Token de Google del Usuario yde ser así registrarlo en nuestra BDD de Usuarios >>>>>>
// ==============================================================================================================
// "app."           = Hacemos la referencia al EXPRESS
// "post"           = Tipo de petición que vamos a estar escuchando, en este caso es un POST
// "'/google'"      = Es el PATH, la ruta
// "async"          = La función debe ser así para poder utilizar el "await" declarado más abajo
// "(pet, res) =>"  = Es una funcion de callback que recibe 2 parámetros: petición(pet), respuesta(res)
app.post('/google', async( pet , res ) =>
{
    // Si nos llegan datos por POST (posiblemente de un formulario) o PUT utilizamos "body"
    // Si nos llegan los datos por la URL utilizamos "params"

    // Recogemos el valor del token que nos llegan por la petición (por el body), que nos llegan por POST
    var token = pet.body.token;

    // El "try" y "catch" son para asegurar que con su "return" si se corta la ejecución de la función "async" en caso de que suceda un error
    // ya que la forma que propone Fernando Herrera estaba generano un error
    try
    {
        // Nos aseguramos que el usuario realmente tenga una cuenta de email en Google
        // "googleuser" = Contendrá los datos que se guardan en la cuenta de email de Google: nombre, email, img
        // "await"      = Indica que se debe esperar la respuesta de la función "verify"
        // "token"      = Mandamos el valor del token a la función "verify"
        var googleUser = await verify( token );
    }
    // Si el token no es válido se dispara el "catch"
    // "err" = Es el error que se recibe
    catch( err )
    {
        res.status( 403 ).json({
            ok: false,
            mensaje: 'Token NO Válido',
        });
        return;
    }
    
    // Verificamos si el email que el Usuario tiene en Google no lo tengamos ya almacenado en BDD lo cuál significaría que ya otro Usuario se autenticó con él    
    // ".findOne"                   = Buscamos en la colección de Usuarios(Usuario) un solo documento(findOne)
    // "email: googleUser.email"    = El valor del campo email(email) debe ser igual al email que llega por "googleUser"
    // "( err , usuarioDB )"        = Se ejecuta una función de callback (después de uqe se ejecute le método "findOne") la cuál puede 
                                    // regresar un posible error(err) o un usuario que existe(usuarioDB)
    Usuario.findOne( { email: googleUser.email } , ( err , usuarioDB ) =>
    {
        // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
        if( err )
        {
            return res.status( 500 ).json({
            ok: false,
            mensaje: 'Error al comprobar la existencia del Usuario',
            errores: err
            });
        }

        // Se regresa un Usuario, ya hay alguien que utilizó esa cuenta de email anteriormente, aunque no necesariamente significa que sea un Usuario
        // distinto, talvez es este mismo Usuario que desea una reautenticación
        if ( usuarioDB )
        {
            // Al Usuario NO lo tenemos registrado con Autenticación de Google,entonces hay que abortar su intento de de ese tipo de logueo
            if ( usuarioDB.google === false )
            {
                return res.status( 400 ).json({
                    ok: false,
                    mensaje: 'Debe de usar su Autenticación Normal'
                    });
            }
            // El Usuario se dió de alta en la BDD usando autenticación de Google
            else
            {
                // Crear el Token
                // "var token"              = Es el que realmente debe usar el Usuario pára trabajar en la Aplicación y no el token de Google el cual sirve
                                            // únicamente para autenticar la cuenta de email de Google
                // ".sign"                  = Es como firmar, estamos creando la firma
                // "{usuario:usuarioDB}"    = PAYLOAD, Es el primer parámetro, es la data que se quiere colocar en el token
                //                          es decir, que el token se va a generar en base a todos los campos del Usuario, excepto el password
                // "SEED"                   = Es la semilla de autenticación, el segundo parámetro es lo que nos ayuda a crear un token único a pesar de que usamos una 
                                            // librería que no hicimos nosotros, se le conoce como SEED o semilla
                // "{ expiresIn: 14400}"    = Fecha de expiración del Token, en este caso son 4 horas: 14400/60 = 240/60
                var token = jwt.sign( { usuario: usuarioDB } , SEED , { expiresIn: 14400 } );

                    res.status( 200 ).json({
                        ok:         true,
                        usuario:    usuarioDB,
                        token:      token,
                        id:         usuarioDB._id,
                        menu:       obtenerMenu( usuarioDB.role )
                    });
            }
        }
        // Es la primera vez que el Usuario se está autenticando en nuestra Aplicación, es decir, no existe en BDD su registro
        else
        {
            // El Usuario NO existe... hay que crearlo
            var NvoUsuario = new Usuario();                 // Creamos una instancia del Modelo de Usuario

            NvoUsuario.nombre      = googleUser.nombre;     // Llenamos los campos del "Modelo" con los datos que tomamos de Google (el "apellido" y "password"
            NvoUsuario.apellido    = ':)';                  // los inventamos porque en la cuenta de email de Google NO existen)
            NvoUsuario.email       = googleUser.email;
            NvoUsuario.img         = googleUser.img;
            NvoUsuario.google      = true;
            NvoUsuario.password    = ':)';

            // ALmacenamos al nuevo Usuario en BDD
            // ".save"  = Método de Mongoose para guardar el registro del nuevo Usuario en BDD
            // () =>    = Regresa una función de callbak (se ejecuta despupes de ejecutar el método ".save") que puede regresar un error(err) o el objeto
                        // del nuevo Usuario registrado(usuarioDB) en BDD
            NvoUsuario.save( err , usuarioDB =>
            {
                // Crear el Token
                // "var token"              = Es el que realmente debe usar el Usuario pára trabajar en la Aplicación y no el token de Google el cual sirve
                                            // únicamente para autenticar la cuenta de email de Google
                // ".sign"                  = Es como firmar, estamos creando la firma
                // "{usuario:usuarioDB}"    = PAYLOAD, Es el primer parámetro, es la data que se quiere colocar en el token
                //                          es decir, que el token se va a generar en base a todos los campos del Usuario, excepto el password
                // "SEED"                   = Es la semilla de autenticación, el segundo parámetro es lo que nos ayuda a crear un token único a pesar de que usamos una 
                                            // librería que no hicimos nosotros, se le conoce como SEED o semilla
                // "{ expiresIn: 14400}"    = Fecha de expiración del Token, en este caso son 4 horas: 14400/60 = 240/60
                var token = jwt.sign( { usuario: usuarioDB } , SEED , { expiresIn: 14400 } );

                    res.status( 200 ).json({
                        ok:         true,
                        usuario:    NvoUsuario,
                        token:      token,
                        id:         NvoUsuario._id,
                        menu:       obtenerMenu( NvoUsuario.role )
                    });
            });
        }

    });
});




// ==============================================================================
// ++++ COMPROBAMOS QUE EL USUARIO EXISTE, ESTA ES LA AUTENTICACIÓN "NORMAL" ++++
// ==============================================================================
// "app."                   = Hacemos la referencia al EXPRESS
// "post"                   = Tipo de petición que vamos a estar escuchando, en este caso es un POST
// "'/'"                    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.post('/',  ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Recoger los parámetros que nos llegan por la petición (por el body), que nos llegan por POST
    var params  = pet.body;

    //Variable que guarda el valor de "email" del objeto "params"
    var email = params.email;

    //Variable que guarda el valor de "password" del objeto "params"
    var password = params.password;


    //Verificamos que el email del usuario nuevo SI exista en la BDD
    //Buscamos en la colección de Usuarios(Usuario) un solo documento(findOne) cuyo email(email) sea igual al email que llega por POST(email)
    //se tiene una función de callback que recibe como parámetro un error(err) o un usuario que existe(usuario)
    Usuario.findOne( { email: email } , ( err , usuario ) =>
    {
        // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
        if( err )
        {
            return res.status( 500 ).json({
            ok: false,
            mensaje: 'Error al comprobar la existencia del Usuario',
            errores: err
            });
        }

        // No se localiza al Usuario con el id Especificado
        if( !usuario )
        {
            return res.status( 400 ).json({
            ok: false,
            mensaje: 'Credenciales incorrectas - Email',
            errores:err
            });
        }
        
        // El email es válido, ahora hay que verificar que el password también sea correcto
        // Se pasa el password que se está recibiendo por POST(password) y el password que está en BDD(usuario.password) y se comparan
        // y retorna TRUE en caso de ser positiva la comparativa y FALSE en caso contrario
        // "bcrypt.compareSync" = Función que permite tomar el string que se desea verificar(password) contra otro string que ya ha sido pasado por el hash(usuario.password)
        if( !bcrypt.compareSync( password , usuario.password ) )
        {
            // El password NO es válido
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - Password',
                errores:err
            });
        }

        // Todo OK
        // Por cuestiones de seguridad NO devolvemos el Password
        usuario.password = undefined;

        // Crear el Token
        // ".sign"                  = Es como firmar, estamos creando la firma
        // "{usuario:usuario}"  =   PAYLOAD, Es el primer parámetro, es la data que se quiere colocar en el token
        //                          es decir, que el token se va a generar en base a todos los campos del Usuario, excepto el password
        // "SEED"                   = Es la semilla de autenticación, el segundo parámetro es lo que nos ayuda a crear un token único a pesar de que usamos una 
                                    // librería que no hicimos nosotros, se le conoce como SEED o semilla
        // "{ expiresIn: 14400}"    = Fecha de expiración del Token, en este caso son 4 horas: 14400/60 = 240/60
        var token = jwt.sign( { usuario: usuario } , SEED , { expiresIn: 14400 } );

        res.status( 200 ).json({
            ok:         true,
            usuario:    usuario,
            token:      token,
            id:         usuario._id,
            menu:       obtenerMenu( usuario.role )
        });        
    });

});



// ============================================================================
// <<<<<< Método para cargar el Array del Menú Lateral en forma dinámica >>>>>>
// ============================================================================
// "ROLE" = Esel rol del Usuario (ROLE_USER o ROLE_ADMIN)
function obtenerMenu( ROLE )
{    
    // Arreglo de objetos para controlar todas las opciones que tenga el menú lateral
    var menu =
    [
        {
            titulo: 'Principal',
            icono: 'mdi mdi-gauge',  // Este valor lo tomamos del archivo "sidebar.component.html"
            submenu:
            [
                // Los valores de los "url" los sacamos del archivo "pages.routes.ts" que está en la carpeta "pages"
                { titulo: 'Dashboard' , url: '/dashboard' },
                { titulo: 'ProgressBar' , url: '/progress' },
                { titulo: 'Gráficas' , url: '/graficas1' },
                { titulo: 'Promesas' , url: '/promesas' },
                { titulo: 'Rxjs' , url: '/rxjs' },
            ]
        },
        {
            titulo: 'Mantenimientos',
            icono: 'mdi mdi-folder-lock-open',
            submenu:
            [
                // { titulo: 'Usuarios' , url: '/usuarios' },
                { titulo: 'Hospitales' , url: '/hospitales'},
                { titulo: 'Medicos' , url: '/medicos' }
            ]
        }
    ];
    
    // El Usuario tiene el ROL de ADMINISTRADOR
    if ( ROLE === "ROLE_ADMIN" )
    {
        // "[ 1 ]"      = Nos referimos al segundo elemento del array, el que tiene el título "Mantenimientos"
        // "unshift"    = Agrega uno o más elementos al inicio del array, y devuelve la nueva longitud del array. No usamos "push" porque 
                        // colocaría el nuevo elemento al final del array
        menu[1].submenu.unshift( { titulo: 'Usuarios' , url: '/usuarios' } );
    }
    
    return menu;
}



// ==============================================
// <<<<<< Método para crear un nuevo Token >>>>>>
// ==============================================
// "app."                           = Hacemos la referencia al EXPRESS
// "get"                            = Tipo de petición que vamos a estar escuchando, en este caso es un GET porque es más simple (aunque bien pudimo haber usado un POST o PUT)
// "'/renuevaToken'"                = Es el PATH, en este caso es la raíz
// "mdAutenticacion.verificaToken"  = Se verifica que el token actual sea válido
// "(pet, res ) =>"                 = Es una funcion de callback que recibe 2 parámetros: petición(pet) y respuesta(res) 
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.get('/renuevaToken' , mdAutenticacion.verificaToken , ( pet , res ) =>
{
    // ++++ A partir del Usuario que obtenemos hay que generar un Nuevo Token ++++
    // Crear el Token
    // ".sign"                  = Es como firmar, estamos creando la firma
    // "{usuario:pet.usuario}"  = PAYLOAD, Es el primer parámetro, es la data que se quiere colocar en el token
    //                          es decir, que el token se va a generar en base a todos los campos del Usuario, excepto el password
    // "pet.usuario"            = El método "verificaToken" nos retorna el objeto "usuario" dueño de ese token, por eso lo podemos usar para generarle un
                                // nuevo Token
    // "SEED"                   = Es la semilla de autenticación, el segundo parámetro es lo que nos ayuda a crear un token único a pesar de que usamos una 
                                // librería que no hicimos nosotros, se le conoce como SEED o semilla
    // "{ expiresIn: 14400}"    = Fecha de expiración del Token, en este caso son 4 horas: 14400/60 = 240/60
    var token = jwt.sign( { usuario: pet.usuario } , SEED , { expiresIn: 14400 } );

    res.status( 200 ).json({
        ok:         true,        
        token:      token        
    });

});


// Exportamos el módulo
// Esto es para que podamos usar el "app" fuera de este archivo (las rutas)
module.exports = app;