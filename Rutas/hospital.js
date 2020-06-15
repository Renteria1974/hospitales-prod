// FICHERO DE CONFIGURACIÓN DE RUTAS DE "HOSPITALES"

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Importamos el Esquema de Hospital que definimos en "Modelos/hospital.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Hospital = require('../Modelos/hospital');

// SERVICIO JWT
// Importar el módulo de JWT, las librerías JWT, para poder acceder a sus métodos
// Nos permite generar un token que será devuelto (en lugar de regresar los datos) cuando se ha logueado correctamente a un usuario
// JSON = Formato de texto Ligero de intercambio de datos basado en un subconjunto del Lenguaje de Programación JavaScript, es independiente del lenguaje que se utiliza
//      puede representar 4 tipos primitivos (cadenas, números, booleanos, valores nulos) y 2 estructurados (objetos y arreglos)
// JWT (JSON WEB TOKEN) = Conjunto de medios de seguridad para peticiones http para representar demandas para ser transferidos entre el cliente y el servidor. Es un
//       Contenedor de Información referente a la autenticación de un usuario. Las partes de un JWT se codifican como un objeto que está firmado digitalmente
//       utilizando JWS (JSON Web Signature)
var jwt = require('jsonwebtoken');

// Cargamos el middleware que creamos en el archivo "Autenticacion.js" dentro de la carpeta "Middlewares"
var mdAutenticacion = require('../Middlewares/autenticacion');



// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();



// =====================================
// ++++ OBTENER TODOS LOS HOSPITALES ++++
// =====================================
// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/'"    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/', ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Si en el query de la petición no viene especificado desde que registro queremos el listado (porque es un parámetro opcional) entonces ponemos "0" para
    // que en ese caso nos comience a mostrar en pantalla a partir del primer registro
    let desde = pet.query.desde || 0;
    desde = Number( desde );  //Nos aseguramos de que sea un valor numérico

    // Lo siguiente es por si requerimos regresar TODOS los hospitales (por ejemplo para cargarlos en un listbox)
    let limite = pet.query.limite || 0;
    limite = Number( limite );        

    // ---- Hacemos uso de Mongoose ----
    // "Hospital.find({}"       = Esta es la consulta, dentro de las llaves podemos poner el query para búsqueda, lo dejamos en blanco porque en este 
    //                          caso deseamos el listado deseamos el listado de todos los medicos
    // "(err, hospitales)=>"    = Es el resultado de la búsqueda, es un callback que recibe 2 parámetros: un posible error(err) o la colección de hospitales(hospitales)
    // ".populate('usuario', nombre email)"   = Para que devuelva el ID, nombre y email del Usuario que hizo el LOGUIN en lugar de solo su ID
    // ".exec("                 = Executamos la consulta
    Hospital.find({})
        .skip( desde )
        .limit( limite )
        .populate('usuario' , 'nombre email')
        .exec(
            ( err , hospitales )=>
            {
            // Ocurrió un error
            if ( err )
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 500 ).json({
                    ok: false,      // La petición NO se realizó
                    mensaje: 'Error al cargar los Hospitales',  // Mensaje que queremos mostrar
                    errors: err     // Descripción del error
                });
            }

            // Todo OK
            // Obtenemos el total de registros obtenidos en la consulta
            // "Medico.countDocuments" = Método de Mongoose para obtener el total de socumentos de una colección, en ese caso de la colección "hospitales"
            // "{}"             = Query, filtro del a búsqueda, en este caso queremos todos yl o dejams en blanco
            // "(err, conteo)"  = Podemos recibir un posible error(err) o bien el total de registros obtenidos(conteo)
            Hospital.countDocuments({}, ( err , conteo )=>
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 200 ).json({
                    ok: true,               // La petición se realizó correctamente
                    hospitales: hospitales, // Regresamos un arreglo con la colección de Objetos de hospitales
                    total: conteo           // Total de resitros obtenidos en la consulta
                });
            })    
        })
});



// ===========================================
// ++++ AGREGAR UN NUEVO HOSPITAL A LA BDD ++++
// ===========================================
// "app."   = Hacemos la referencia al EXPRESS
// "post"   = Tipo de petición que vamos a estar escuchando, en este caso es un POST
// "'/'"    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.post('/' , mdAutenticacion.verificaToken , ( pet , res , next ) =>
{  
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Recoger los parámetros que nos llegan por la petición (por el body), que nos llegan por POST
    var params  = pet.body;

    // Creamos una instancia (Objeto) de Usuario
    // Le envíamos los parámetros respectivos obtenidos del POST
    var hospital = new Hospital({
        nombre:     params.nombre,
        usuario:    pet.usuario._id,
        activo:     params.activo
    });    
    
    //Guardamos los valores del Nuevo Hospital en la BDD
    // ".save"                          = Método de mongoose
    // "( err, hospitalGuardado )=>"    = Se recibe un callback, es decir, una función que regresa cuandose graba el hospital en BDD
    // "err"                            = Posible Error
    // "hospitalGuardado"               = hospitalGuardado, es todo el objeto con todos los datos del nuevo hospital que ya se guardó en BDD
    hospital.save( ( err, hospitalGuardado )=>
    {
       //En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
       if( err )
       {
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'Error al Intentar Guardar al Nuevo Hospital',
                errores: err 
            });
        }

        // Todo OK
        res.status( 201 ).json({
            ok: true,                   // La petición se realizó correctamente
            hospital: hospitalGuardado  // Regresamos el objeto del hospital que se acaba de guardar en BDD        
        });
    });

});



// ===================================================
// ++++ ACTUALIZAR EN BDD LOS DATOS DE UN HOSPITAL ++++
// ===================================================
// "app."   = Hacemos la referencia al EXPRESS
// "put"    = Tipo de petición que vamos a estar escuchando, en este caso es un PUT
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.put('/:id' , mdAutenticacion.verificaToken,  ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdHospital   = pet.params.id;

    //Recogemos los datos que tenemos en el body (los valores nuevos) para modificar el usuario
    var NuevosDatos = pet.body;

    // "Hospital"           = Hacemos uso del Esquema de hospital definido en el archivo "hospital.js" dentro de la carpeta "Modelos"
    // ".findById"          = Instrucción de Mongoose, buscamos un documento por su Id
    // "(err,hospital)=>"   = Función de callback con 2 parámetros de retorno: un posible error(err) o la respuesta, que en este caso es el objeto de un hospital(hospital) obtenido de la consulta a la BDD
    Hospital.findById( IdHospital , ( err , hospital ) =>
    {
        // Tenemos un error
        if( err )
        {
            return res.status( 500 ).json({
                ok: false,
                mensaje: 'Error al buscar al Hospital',
                errores: err
            });
        }
        // El hospital no nos llega, el objeto está vacío
        if( !hospital )
        {
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'El Hospital con el id ' + IdHospital + ' no existe',
                errores: { message: 'No existe un Hospital con ese Id'}
            });
        }

        // Todo OK, Se localizó el registro del Hospital, estamos listos para actualizar la DATA del Hospital
        // Modificamos los datos del Hospital de acuerdo a los nuevos valores que nos llegan por el BODY
        hospital.nombre     = NuevosDatos.nombre;        
        hospital.usuario    = pet.usuario._id;
        hospital.activo     = NuevosDatos.activo;

        // Guardamos el Registro del Hospital con los nuevos valores
        // ".save"              = Método de mongoose
        // "( err, hospitalGuardado )=>" = Se recibe un callback, es decir, una función que regresa cuandose graba el hospital en BDD
        // "err"                = Posible Error
        // "hospitalGuardado"   = Hospital Guardado, es todo el objeto con todos los datos del nuevo hospital que ya se guardó en BDD
        hospital.save(( err , hospitalGuardado )=>
        {
            // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
            if(err)
            {
                return res.status( 400 ).json({
                    ok: false,
                    mensaje: 'Error al Intentar Actualizar los datos del Hospital',
                    errores: err
                });
            }
            
            // Todo OK
            res.status( 200 ).json({
                ok: true,                   // La petición se realizó correctamente
                hospital: hospitalGuardado  // Regresamos el objeto del hospital que se acaba de guardar en BDD
            });
        });
    });
});



// ======================================================
// ++++ ELIMINAR DE LA BDD EL REGISTRO DE UN HOSPITAL ++++
// ======================================================
// "app."   = Hacemos la referencia al EXPRESS
// "delete" = Tipo de petición que vamos a estar escuchando, en este caso es un DELETE
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.delete('/:id' , mdAutenticacion.verificaToken , ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdHospital = pet.params.id;

    // Hacemos referencia a nuestro Modelo de Usuario
    //".findByIdAndDelete"  = Buscamos un documento por su Id y lo eliminamos
    //(err,hospitalBorrado) = Función de callback con 2 parámetros de retorno: un posible error(err) o el objeto de un Hospital(hospitalBorrado)
                            // obtenido de la consulta a la BDD
    Hospital.findByIdAndDelete( IdHospital , ( err , hospitalBorrado )=>
    {
        // No se localiza al Hospital con el id Especificado
        if( !hospitalBorrado )
        {
            return res.status( 400 ).json({
                ok: false,   
                mensaje: 'No existe un Hospital con el ID especificado',
                errores: { message: 'No existe un Hospital con el ID especificado' }
            });
        }

        // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
         if( err )
         {
             return res.status( 500 ).json({
                ok: false,
                mensaje: 'Error al Intentar Eliminar los datos del Hospital',
                errores: err
             });
         }

         // Todo OK
         res.status( 200 ).json({
            ok: true,                  // La petición se realizó correctamente
            hospital: hospitalBorrado  // Regresamos el objeto del hospital que se acaba de Eliminar de la BDD
         });
    });
});



// ======================================================
// ++++ OBTENER LOS DATOS DE UN HOSPITAL ++++
// ======================================================
// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res ) =>" = Es una funcion de callback que recibe 2 parámetros: petición(pet) y respuesta(res)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.get('/:id', ( req , res ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var id = req.params.id;
    
    // Hacemos referencia a nuestro Modelo de Hospital
    //".findById"                             = Buscamos un documento por su Id
    // ".populate('usuario', nombre email)"   = Para que devuelva el nombre img y email del Usuario que 
    // ".exec("                               = Executamos la consulta
    Hospital.findById( id )
        .populate('usuario' , 'nombre img email')
        .exec(( err , hospital ) =>
        {
            // Se produce un error
            if ( err )
            {
                return res.status( 500 ).json({
                    ok: false,
                    mensaje: 'Error al buscar hospital',
                    errors: err
                });
            }
            // Se reguresa un Objeto "hospital" vacío
            if ( !hospital )
            {
                return res.status( 400 ).json({
                    ok: false,
                    mensaje: 'El hospital con el id ' + id + 'no existe',
                    errors: { message: 'No existe un hospital con ese ID' }
                });
            }
            res.status( 200 ).json({
                ok: true,
                hospital: hospital
            });
        })
});



// Exportamos el módulo
// Esto es para que podamos usar el "app" fuera de este archivo (las rutas)
module.exports = app;