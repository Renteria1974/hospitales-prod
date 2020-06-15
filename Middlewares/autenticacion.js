// MIDDLEWARE =  Método o función que se va a ejecutar antes de que se ejecute la acción del Controlador, de forma que al hacer una petición HTTP lo primero
//              que se va a comprobar es si la autentificación del token es correcto y en caso de ser así se va a pasar al método del controlador



// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// SERVICIO JWT
// Importar el módulo de JWT, las librerías JWT, para poder acceder a sus métodos
// Nos permite generar un token que será devuelto (en lugar de regresar los datos) cuando se ha logueado correctamente a un usuario
// JSON = Formato de texto Ligero de intercambio de datos basado en un subconjunto del Lenguaje de Programación JavaScript, es independiente del lenguaje que se utiliza
//      puede representar 4 tipos primitivos (cadenas, números, booleanos, valores nulos) y 2 estructurados (objetos y arreglos)
// JWT (JSON WEB TOKEN) = Conjunto de medios de seguridad para peticiones http para representar demandas para ser transferidos entre el cliente y el servidor. Es un
//       Contenedor de Información referente a la autenticación de un usuario. Las partes de un JWT se codifican como un objeto que está firmado digitalmente
//       utilizando JWS (JSON Web Signature)
var jwt = require('jsonwebtoken');

// Importamos el archivo "config.js" para poder usar la constante SEED
// ".SEED" = Aquí mismo le damos el valor de la constante a la variable que estamos declarando
var SEED = require('../config/config').SEED;



// =======================================
// ++++ VERIFICAR TOKEN (MIDDLEWARE)  ++++
// =======================================
//"exports.verificaToken"   = Se exporta directamente un método llamado "verificaToken"
//"function(pet,res,next)"  = Función anónima que va a recibir 3 parámetros: pet(petición),res(respuesta),
//                            next(pasar al siguiente paso de la petición http que generalmente es el método de la ruta que estamos llamando)
exports.verificaToken = function( pet , res , next )
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Recibimos el valor del token
    var token = pet.query.token;

    // Verificamos que el token sea correcto
    // ".verify"        = Función para verificar la validez del token
    // "token"          = Primer parámetro, es el valor del token que estamos recibiendo de la petición, se pueden recibir por los HEADERS 
                        // pero nosotros lo vamos a hacer a travez del URL
    // "SEED"           = Segundo parámetro, es la semilla, la constante que generamos en el archivo "login.js"
    // "(err,decoded)"  = Tercer parámetro, es un callback, que retorna o bien un error(err) o bien la información del Usuario que hizo 
                        // Login(decoded) porque eso es lo que colocamos en el PAYLOAD
    jwt.verify( token , SEED , ( err , decoded ) =>
    {
        // En caso de haber un error
        if ( err )
        {
            // ".json" = Convertimos la respuesta a un objeto JSON
            return res.status( 401 ).json({
                ok: false,                      // La petición NO se realizó
                mensaje: 'Token Incorrecto',    // Mensaje que queremos mostrar
                errors: err                     // Descripción del error
            });
        }

        // Que la información del Usuario que hizo la Petición esté disponible en cualquier petición en donde se use la función de "verificaToken"
        // "pet.usuario"        = En la Petición colocamos al Usuario que tenemos en el Token (el que hizo Loguin)
        // "decoded.usuario"    = Se extrae al Usuario del "decoded"
        pet.usuario = decoded.usuario;

        // Pasamos al siguiente método de la ruta, es para que el middleware no entre en bucle infinito, que salga de aquí
        // es decir, los métodos que están abajo (crear usuario, modificar usuario, eliminar usuario) ya no se quedan "congelados"
        next();
    });
}



// =======================================
// ++++ VERIFICAR ADMIN (MIDDLEWARE)  ++++
// =======================================
//"exports.verificaROLE_ADMIN"  = Se exporta directamente un método llamado "verificaTOLE_ADMIN"
//"function(pet,res,next)"      = Función anónima que va a recibir 3 parámetros: pet(petición),res(respuesta),
//                              next(pasar al siguiente paso de la petición http que generalmente es el método de la ruta que estamos llamando)
exports.verificaROLE_ADMIN = function( pet , res , next )
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"
    
    var usuario = pet.usuario;  // Este valor de "usuario" recordemos que lo "agregamos" a la "pet" al ejecutarse el middelware "verificaToken"

    // El Usuario logueado es del tipo "ADMINISTRADOR"    
    if ( usuario.role === 'ROLE_ADMIN' )
    {
        // Pasamos al siguiente método de la ruta, es para que el middleware no entre en bucle infinito, que salga de aquí
        // es decir, los métodos que están abajo (crear usuario, modificar usuario, eliminar usuario) ya no se quedan "congelados"
        next();

        return; // Ya no debe ser necesario ( para eso tenemos el "next", pero así nos aseguramos de que se salte a la siguiente instrucción )
    }
    // Mandamos mensaje de error
    else
    {
        // ".json" = Convertimos la respuesta a un objeto JSON
        return res.status( 401 ).json({
            ok: false,                                                                      // La petición NO se realizó
            mensaje: 'Token Incorrecto - No es Administrador',                              // Mensaje que queremos mostrar
            errors: { mensaje: 'No es Administrador, Carece de los Permisos Necesarios' }   // Descripción del error
        });         
    }    
}



// =======================================================
// ++++ VERIFICAR ADMIN o Mismo Usuario (MIDDLEWARE)  ++++
// =======================================================
//"exports.verificaROLE_ADMIN_o_MismoUsuario"   = Se exporta directamente un método llamado "verificaTOLE_ADMIN"
//"function(pet,res,next)"                      = Función anónima que va a recibir 3 parámetros: pet(petición),res(respuesta),
//                                              next(pasar al siguiente paso de la petición http que generalmente es el método de la ruta que estamos llamando)
exports.verificaROLE_ADMIN_o_MismoUsuario = function( pet , res , next )
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    var id = pet.params.id;     // Recibimos por la URL el ID del Usuario que se intenta modificar
    
    var usuario = pet.usuario;  // Este valor de "usuario" recordemos que lo "agregamos" a la "pet" al ejecutarse el middelware "verificaToken"

    // El Usuario logueado es del tipo "ADMINISTRADOR" o el usuario que se recibe del token (usuario._id) es igual al que recibimos por la URL (id)
    if ( usuario.role === 'ROLE_ADMIN' || usuario._id === id )
    {
        // Pasamos al siguiente método de la ruta, es para que el middleware no entre en bucle infinito, que salga de aquí
        // es decir, los métodos que están abajo (crear usuario, modificar usuario, eliminar usuario) ya no se quedan "congelados"
        next();

        return; // Ya no debe ser necesario ( para eso tenemos el "next", pero así nos aseguramos de que se salte a la siguiente instrucción )
    }
    // Mandamos mensaje de error
    else
    {
        // ".json" = Convertimos la respuesta a un objeto JSON
        return res.status( 401 ).json({
            ok: false,                                                                      // La petición NO se realizó
            mensaje: 'Token Incorrecto - No es Administrador ni es el mismo Usuario',       // Mensaje que queremos mostrar
            errors: { mensaje: 'No es Administrador, Carece de los Permisos Necesarios' }   // Descripción del error
        });         
    }    
}