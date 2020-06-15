// FICHERO DE CONFIGURACIÓN DEL SERVICIO DE IMAGENES

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas

// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Con esta librería podemos acceder directamente a las rutas de nuestro sistema de archivos
const Ruta = require('path');

// "fs"=Librería File System de Node la cual nos permite trabajar con el sistema de archivos de NodeJS
var Sist_Archivos = require('fs');


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();



// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/:tipo/:img'"           = "tipo" es para indicar si la imagen es de un usuario,hospital o medico, "img" es el nombrede la imagen que se desea localizar
// "nombreArchivo"  = Es el nombre completo del archivo de la imagen
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/:tipo/:img', ( pet , res , next ) =>
{
    
    // Si nos llegan datos por POST o GET utilizamos "body"
    // Si nos llegan los datos por la URL utilizamos "params"

    // Obtenemos el origen de la imagen (usuarios, hospitales.medicos)
    var tipo = pet.params.tipo;

    // Obtenemos el nombre de la imagen
    var img = pet.params.img;

    // Creamos un path para verificar que el archivo de la imagen realmente existe y si no existe entonces
    // se muestra una magen por defecto
    // "__dirname" = Obtenemos toda la ruta de donde nos encontramos en el momento actual
    var pathImagen = Ruta.resolve( __dirname, `../uploads/${ tipo }/${ img }` );

    // Aqui comprobamos si es válido el path completo, la Imagen existe
    if( Sist_Archivos.existsSync( pathImagen ) )
    {
        // Mostramos la imagen
        res.sendFile( pathImagen );
    }
    // La ruta no es válida, la imagen NO existe
    else
    {
        // Creamos el path de la imagen por defecto
        var pathNoImagen = Ruta.resolve( __dirname,'../assets/no-img.jpg' );

        // Mostramos la imagen
        res.sendFile( pathNoImagen );
    }
    
});


// Exportamos el módulo
// Esto es para que lo podamos usar fuera de este archivo el "app" (las rutas)
module.exports = app;