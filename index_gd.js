// onSuccess Callback
// This method accepts a Position object, which contains the
// current GPS coordinates
//

var hostWS = "demo2010.smartncc.it";
var urlFisso = "";

/*COMMENTARE PER APP GENERICA*/
//hostWS = "mytour.smartncc.it";
//urlFisso = "http://mytour.ncconline.it/catalogo_noleggio/dashboard.aspx?parent_host=mobile_app&app_init=1";
//urlFisso = "http://mytour.smartncc.it/catalogo_noleggio/API_test.htm";

var db = null;
var token = "";

var onSuccess = function(position) {
    alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');
};

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function onLoad() {
    if (urlFisso != "") {
        window.location.href = "";
    }
    else {
        $("#template").hide();
        $("[id^=impostazioni_]").hide();
        document.addEventListener("deviceready", onDeviceReady, false);
    }
}

function homePageExt()
{
    window.open(encodeURI("https://mytour.smartncc.it/catalogo_noleggio/API_test.htm"), '_self')
}

function onDeviceReady() {
    alert('onDeviceReady');
    $("#header").css("visibility","visible");
    $("#body_offline").css("visibility", "visible");
    $("#footer").css("visibility", "visible");

    if (!window['postMessage'])
        alert("oh crap");
    else {
        if (window.addEventListener) {
            window.addEventListener("message", ReceiveMessage, false);
        }
        else {
            window.attachEvent("onmessage", ReceiveMessage);
        }
    }

    /*
    db = window.openDatabase("ncconlinedb", "1.0", "SmartNCCMobile", 200000);

        db.transaction(function (tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS elenco(id INTEGER PRIMARY KEY ASC, codice, url_ncconline, username, password)");
            aggiornaElencoNoleggiatori(tx);
        }
            , errorCB, successCB);

        $.get(
        "http://" + hostWS + "/progettogestionale/wssmartncc/wsgd.asmx/login_ASCII?username=ncc_online_guest_api&password=ncc_guest",
        function (data) {
            if (data.indexOf("+OK:") == 0) {
                token = data.replace("+OK:", "");
            }
            else {
                alert('errore login webservice');
            }
        }
        );    */
}

function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    alert('Connection type: ' + states[networkState]);
}


function aggiornaElencoNoleggiatori(tx) {
    tx.executeSql('SELECT * FROM elenco', [], okLetturaElenco, errorCB);
}

function successCB() {
    return false;
}


function okLetturaElenco(tx, results)
{
    try
    {
        var len = results.rows.length;
        var template = $("#template").html();
        $("#divElencoNoleggiatori").html("<lu>");

        for (var i = 0; i < len; i++) {
            var descrizione = "Noleggiatore n. = " + i + " id = " + results.rows.item(i).id;
            var templateApp = "";
            templateApp = template.replace(/TAG_CODICE/gi, results.rows.item(i).codice);
            templateApp = templateApp.replace(/TAG_USERNAME/gi, results.rows.item(i).username);
            templateApp = templateApp.replace(/TAG_PASSWORD/gi, results.rows.item(i).password);
            templateApp = templateApp.replace(/TAG_URLNCCONLINE/gi, results.rows.item(i).url_ncconline);
            templateApp = templateApp.replace(/TAG_DESCRIZIONE/gi, descrizione);

            $("#divElencoNoleggiatori").html($("#divElencoNoleggiatori").html() + "</li>" + templateApp + "</li>");
        }
        $("#divElencoNoleggiatori").html($("#divElencoNoleggiatori").html()+"</lu>");
    } catch (e) { alert('eccezione: '+e);}
    return false;
}

function errorCB(err) {
    alert("SQLError (" + err.code + "): " + err.message);
    return false;
}

function aggiungiNoleggiatore() {
    db.transaction(okAggiungiNoleggiatore, errorCB, successCB);
}

function okAggiungiNoleggiatore(tx) {
    var codice = $("#tfCodiceNoleggiatore").val();
    if (codice != "") {

        tx.executeSql("SELECT * FROM elenco where codice = '"+codice+"'", [], 
            function (tx, results) {
                if (results.rows.length == 0) {
                    $.get(
                        "http://" + hostWS + "/progettogestionale/wssmartncc/ws_ncc.asmx/get_ncconline_url_bycode_ASCIIJSON?token=" + token + "&code=" + codice,
                        function (data) {
                            db.transaction(
                                function (tx) {
                                    if ((data + "").indexOf("-Err") == -1) {
                                        var str = eval(JSON.parse(data).obj);
                                        var query = 'INSERT INTO elenco (codice, url_ncconline,username,password) VALUES ("' + str.split("|")[0] + '","' + str.split("|")[1] + '","","")';
                                        tx.executeSql(query);
                                        aggiornaElencoNoleggiatori(tx);
                                    }
                                    else
                                    {
                                        alert('Codice non valido');
                                        aggiornaElencoNoleggiatori(tx);
                                    }
                                }
                                , errorCB, successCB);
                        }
                    );
                }
                else
                {
                    alert("Il noleggiatore risulta in elenco");
                }
            }
            , errorCB);



    }
    else {
        alert("inserire prima il codice");
    }
}

function salvaCredenziali(codice)
{
    db.transaction(
        function (tx)
        {
            var query = "update elenco set username = '" + $("#tfUsername_" + codice).val() + "', password = '" + $("#tfPassword_" + codice).val() + "' where codice = '" + codice + "'";
            tx.executeSql(query);
            aggiornaElencoNoleggiatori(tx);
        }
        , errorCB, successCB);
}

function eliminaNoleggiatore(codice) {
    db.transaction(
        function (tx) {
            var query = "delete from elenco where codice = '" + codice + "'";
            tx.executeSql(query);
            aggiornaElencoNoleggiatori(tx);
        }
        , errorCB, successCB);
}


function toggle(codice)
{

    if (!$("#impostazioni_"+codice).is(':visible')) {
        $("[id^=impostazioni_]").hide();
        $("#impostazioni_" + codice).show();
    }
    else {
        $("#impostazioni_" + codice).hide();
    }
}

function scanNewCode() { 
    cordova.plugins.barcodeScanner.scan( 
    function (result) { 
            $("#tfCodiceNoleggiatore").val(result.text); 
        }, 
function (error) { 
        alert("Scansione non riuscita [" + error + "]"); 
    } 
); 
} 

function connectBT(macAddress) 
{
    bluetoothSerial.isConnected(
    function () {
        btConnected();
    },
    function () {
        bluetoothSerial.connectInsecure(
                    macAddress,  // device to connect to
                    btConnected,    // start listening if you succeed
                    btError    // show the error if you fail
                );
    }
);

}

function btConnected()
{
    writeBT("hello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\n");
    writeBT("hello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\n");
    writeBT("hello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\nhello, world bt IOS e ANDROID\n");
}

function btError() {
    alert('error bt');
}

function writeBT(str)
{
    bluetoothSerial.write(str, successWriteBT, failureWriteBT);
}

function successWriteBT()
{
    //alert('scritto su seriale');
}

function failureWriteBT()
{
    alert('error scrittura su seriale');

}

function closeBT()
{

}




function ReceiveMessage(evt) {
    alert("messaggio ricevuto")
    var message = evt.data.split('__separatore_postmessage__')[0];
    var callbackJS = evt.data.split('__separatore_postmessage__')[1];
    var origine = evt.origin;
    var ta = document.getElementById("taRecvMessage");
    if (ta == null)
        alert(message);
    else {
        document.getElementById("taRecvMessage").innerHTML = message+' da ['+origine+']';
        eval(evt.data);
    }

    evt.source.postMessage(callbackJS, origine);
} 




