// FICHERO DE CONFIGURACIÓN PARA SUBIR ARCHIVOS DE IMÁGENES AL SERVIDOR

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas

// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Cargamos el módulo "express-fileupload" que nos va a permitir subir archivos al Servidor
var fileUpload = require('express-fileupload');

// "fs"=Librería File System de Node la cual nos permite trabajar con el sistema de archivos de NodeJS
var Sist_Archivos = require('fs');

// Importamos el Esquema de Usuario que definimos en "Modelos/Usuario.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Usuario = require('../Modelos/usuario');

// Importamos el Esquema de Medico que definimos en "Modelos/medico.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Medico = require('../Modelos/medico');

// Importamos el Esquema de Hospital que definimos en "Modelos/hospital.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Hospital = require('../Modelos/hospital');


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();


// ++++ MIDDLEWARES ++++
// Necesario para subir archivos al Servidor
app.use(fileUpload());


// "app."                   = Hacemos la referencia al EXPRESS
// "put"                    = Tipo de petición que vamos a estar escuchando, en este caso es un PUT ya que se va a actualizar el campo imagen de un documento de una colección
// "'/:tipo/:id'"           = "tipo" es para indicar si la imagen es de un usuario,hospital o medico, "id" es el usuario que se desea actualizar
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//                          se ejecute esta función continue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.put('/:tipo/:id', ( pet , res , next ) =>
{    
    // Si nos llegan datos por POST o GET utilizamos "body"
    // Si nos llegan los datos por la URL utilizamos "params"

    // Obtenemos hacia donde va dirigida la imagen
    var tipo = pet.params.tipo;

    // Obtenemos sl ID del Usuario
    var id = pet.params.id;


    // Validamos que la variable "tipo" realmente tenga un valor válido
    var tiposValidos = [ 'hospitales' , 'usuarios' , 'medicos' ];
    
    if ( tiposValidos.indexOf( tipo ) <0 )
    {
        // ".json" = Covertimos la respuesta a un objeto JSON
        return res.status( 400 ).json({
            ok: false,                                                  // La petición NO se realizó
            mensaje: 'El tipo de colección NO es válida',               // Mensaje que queremos mostrar
            errors: { message: 'El tipo de colección NO es válida' }    // Descripción del error
        });
    }

    
    // NO vienen archivos dentro de la petición
    if( !pet.files )
    {
        // ".json" = Covertimos la respuesta a un objeto JSON
        return res.status( 400 ).json({
            ok: false,                                              // La petición NO se realizó
            mensaje: 'No se seleccionó ningun archivo',             // Mensaje que queremos mostrar
            errores: { message: 'Se debe seleccionar una imagen' }   // Descripción del error
        });
    }

    // Nos aseguramos que el archivo que se está recibiendo es una imagen
    // ---------------------------------------------
    // Obtenemos el nombre el archivo
    // "imagen" es el nombre del "key" que declaramos en el POSTMAN
    var archivo = pet.files.imagen

    // Partimos el nombre del archivo en un arreglo de elementos a partir del "."app.js"
    // es decir, si tenemos un archivo que se llame: memo.renteria.rdz.jpg se creará el arreglo: [memo,renteria,rdz,jpg]
    var nombreCortado = archivo.name.split('.');

    // Obtenemos la extensión del archivo, es la última posición del arreglo que creamos anteriormente
    // "pop()"          = Elimina el último elemento del arreglo y lo devuelve
    //                  tambien pudimos haber usado: nombreCortado[ nombreCortado.length-1 ]
    // "toLowerCase"    = Prevenimos que el archivo tenga la extensión en Mayúsculas
    var extensionArchivo = nombreCortado.pop().toLowerCase();

    // Validamos que extensiones de archivo necesitamos realmente
    var extensionesValidas = [ 'png' , 'jpg' , 'gif' , 'jpeg' ];

    // Nos aseguramos que la extensión del archivo que intentamos subir sea de las que aceptamos
    if( extensionesValidas.indexOf( extensionArchivo ) < 0 )
    {
        // ".json" = Covertimos la respuesta a un objeto JSON
        return res.status( 400 ).json({
            ok: false,                                              // La petición NO se realizó
            mensaje: 'Extensión NO válida',                         // Mensaje que queremos mostrar
            errores: { message: 'Las estensiones válidas son: ' + extensionesValidas.join(', ') }   // Descripción del error
        });
    }
    // ---------------------------------------------


    // Creamos un nombre de archivo personalizado
    // ---------------------------------------------
    // El formato será: IDdelUsuario-númeroRandom.extensióndelarchivo
    // `` = Hacemos un Template literal
    // "${ id }" = ID del Usuario
    // "${ new Date().getMilliseconds() }" = Obtenemos los milisegundos de la hora actual, son 3 dígitos"
    // "{extensionArchivo}" = Es la extensión del archivo
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${extensionArchivo}`;
    // ---------------------------------------------


    // Mover el archivo del temporal a un path en específico (dentro de nuestra carpeta "uploads" que está en el directorio raiz de BACKEND-SERVER)
    // ---------------------------------------------
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;

    // "mv"      = Es la función param over el archivo
    // "err"    = Es una función de callback que va a recibir un error en caso de que suceda
    archivo.mv( path, err=>
    {
        // Sucedió un Error
        if( err )
        {
            // ".json" = Covertimos la respuesta a un objeto JSON
            return res.status( 500 ).json({
                ok: false,                              // La petición NO se realizó
                mensaje: 'Error al mover el archivo',   // Mensaje que queremos mostrar
                errores: err                            // Descripción del error
            });
        }


        // Método para "enlazar" el archivo de imagen a un registro de la colección a la que corresponde
        subirPorTipo( tipo , id , nombreArchivo , path , res );
    });
    // ---------------------------------------------
});



// Método para "enlazar" el archivo de la imagen a un registro de la colección a la que corresponde
// "tipo"           = Es la colección que se va a actualizar (usuarios, medicos, hospitales")
// "id"             = Es el ID del usuario
// "nombreArchivo"  = Es el nombre completo del archivo de la imagen
// "res"            = Es porque deseamos sacar la respuesta en formato JSON desde aquí
function subirPorTipo( tipo , id , nombreArchivo , path , res )
{
    
    // Creamos un arreglo de Objetos con elementos que hacen referencia a nuestros modelos
    var Modelos =
    {
        usuarios: Usuario,
        medicos: Medico,
        hospitales: Hospital
    };

    // "hasOwnProperty" = Función de Mongoose, verifica si el arreglo "Modelos" tiene un campo llamado igual que el valor de "tipo"
    if ( Modelos.hasOwnProperty( tipo ))
    {
        // "Modelos[tipo]"  = Accedemos al valor (dentro del arrelglo "Modelos") del campo contenido en la variable "tipo"
        // ".findById"      = Buscamos un documento por su Id
        // " id"            = es el ID del usuario que deseamos localizar
        // "(err,usuario)"  = Función de callback con 2 parámetros de retorno: un posible error(err) o el objeto de un usuario(usuario) obtenido de la consulta a la BDD
        Modelos[ tipo ].findById( id , ( err , modelo ) =>
        {            
            // Ocurrió un Error
            if( err )
            {                
                // Dado que el archivo de la imagen ya se ha subido al Servidor entonces hay que borrarlo                
                Sist_Archivos.unlinkSync( path );

                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 406 ).json({
                    ok: false,                      // La petición NO se realizó
                    mensaje: 'Formato incorrecto',  // Mensaje que queremos mostrar
                    errores: err                    // Descripción del error
                });
            }

            // El objeto viene vacío
            if( !modelo )
            {
                // Dado que el archivo de la imagen ya se ha subido al Servidor entonces hay que borrarlo
                Sist_Archivos.unlinkSync( path );

                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 400 ).json({
                    ok: false,                                  // La petición NO se realizó
                    mensaje: 'El Registro NO Existe',           // Mensaje que queremos mostrar
                    errores: {message: 'El Registro NO Existe'} // Descripción del error
                });
            }

            
            // Si es una actualización de imagen entonces obtenemos el PATH viejo de la imagen anterior
            var pathViejo = `uploads/${tipo}/` + modelo.img;
            
            
            // Checamos si existe un archivo de imagen actualmente y de ser así lo borramos
            //"function(exists)" = función de callback que recibe el parámetro "exists"
            Sist_Archivos.exists( pathViejo , function( exists )
            {
                //El archivo SI existe
                if( exists )
                {
                    Sist_Archivos.unlink( pathViejo , ( err ) => {} );
                }
                //El Archivo NO Existe
                else {}
            });

            // Reasignamos el nombre del archivo en la BDD
            modelo.img = nombreArchivo;

            // Guardamos los valores del Registro Modificado en la BDD
            // ".save"           = Método de mongoose
            // "err"             = Posible Error
            // "modeloGuardado"  = Modelo (Usuario, Medico, Hospital) Guardado, es todo el objeto con todos los datos actualizados
            modelo.save( ( err , modeloGuardado ) =>
            {
                // En caso de ser un USUARIO entoncesor cuestiones de seguridad no mostramos el Password
                if( tipo === 'usuarios')
                {
                    modeloGuardado.password = undefined;
                }

                // Todo OK
                // ".json" = Convertimos la respuesta a un objeto JSON
                return res.status( 200 ).json({
                    ok: true,                                       // La petición NO se realizó
                    mensaje: 'Imagen Actualizada correctamente',    // Mensaje que queremos mostrar
                    [tipo]: modeloGuardado,                         // Regresamos el Registro ya actualizado
                });
            });

        });
    }
}


// Exportamos el módulo
// Esto es para que lo podamos usar fuera de este archivo el "app" (las rutas)
module.exports = app;