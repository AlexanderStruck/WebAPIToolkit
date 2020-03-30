/* Web-API Toolkit: JavaScript library to work with the WebAPI for Microsoft Dynamics CRM 2016 / Dynamics 365
*
* Web-API Toolkit is a JavaScript library to help developers using the WebAPI which has been released with
* Microsoft Dynamics CRM 2016. This API wraps all common operations to work with data in Microsoft Dynamics CRM.
* The design of the interface is on purpose similar to the XrmServiceToolkit. This is meant to help developers 
* get used to this API faster.
*
*
* Credits:
*   To the company ascendit (www.ascendit.de) for supporting this project
*   The idea of this library was inspired by the XrmServiceToolkit (https://xrmservicetoolkit.codeplex.com/)
*****************************************************************************************************************
* Version 1.0.0.0: 
* - Support for all CRUD-operations
* - Support for assigning records and set the state of records.
*****************************************************************************************************************
* Version 1.0.0.1: 
* - Bugfix: Setting lookup to null did not clear the lookup
* - Bugfix: Missing calling of callback-function in raw execute statements
*****************************************************************************************************************
* Version 1.0.0.2: 
* - Since CRM V.8.2.1.207 the retrievement of fetchXML does not need twice encodeURIComponent anymore (fixed via version comparison)
*****************************************************************************************************************
* Version 1.0.0.3: 
* - Since CRM V.9.x the retrievement of fetchXML is made with a batchrequest (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/webapi/execute-batch-operations-using-web-api)
*****************************************************************************************************************
* Version 1.0.0.4: 
* - Adding Errorhandling for all asynchronous calls
* - Added function ExecuteWorkflow()
* - Added new parameter for Fetch(): 
*       All: Retrieves all records for all pages for the given query
* **MIRGATION to 1.0.0.4**
* .> Since CRM 9.0 the result of a LinkedEntity + attribute is returned differently. 
*    Instead of <Alias>_x002e_<Attribute> the result is <Alias>.<Attribute>. Adjust your code accordingly.
*****************************************************************************************************************
*/

WebAPIToolkit = function () {
    /// <summary>
    /// WebAPIToolkit.Web for all 
    /// </summary>
};

WebAPIToolkit.Common = function () {


    return {
        NoGuidSet: "No guid set",
        NoLogicalNameSet: "No logicalname set",
        IncorrectLogicalnameForAssignment: "Incorrect logicalname: It has to be systemuser or team",
        IsObject: function (par) {
            /// <summary>Checks if the parameter is of type 'object'</summary>
            /// <returns type="bool">Result: true / false</returns>
            return (typeof (par) == 'object');
        },
        IsGuid: function (par) {
            /// <summary>Checks with a regular expression if the parameter is a GUID</summary>
            /// <returns type="bool">Result: true /false</returns>
            return /^(\{{0,1}([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}\}{0,1})$/.test(par);
        },
        ParseGUID: function (GUID) {
            /// <summary>Removes the starting and ending bracket of the GUID</summary>
            /// <param name="GUID" type="string">GUID to be parsed</param>
            /// <returns type="GUID">Raw GUID or null</returns>

            if (WebAPIToolkit.Common.IsGuid(GUID)) {
                return (GUID[0] == '{') ? GUID.substr(1, 36) : GUID.substr(0, 36);
            }

            return null;
        },
        Merge: function (URL1, URL2) {
            /// <summary>Connects two URLs. There is no validation for a valid URL.</summary>
            /// <param name="URL1" type="string">URL</param>
            /// <param name="URL2" type="string">Additional URL</param>
            /// <returns type="string">Merged URL</returns>
            if (!URL1) return (!URL2 ? "" : URL2);
            if (!URL2) return (!URL1 ? "" : URL1);

            if (URL1.length > 0 && URL2.length > 0) {
                return (URL1[URL1.length - 1] == "/" ? URL1 : URL1 + "/") + (URL2[0] == "/" ? URL2.substr(1, URL2.length - 1) : URL2);
            }

            return "";
        },
        CRMVersion: null,
        GetVersion: function () {
            /// <summary>Gets the version of the current CRM organisation</summary>
            /// <returns type="string">Retrieved version</returns>

            if (!!WebAPIToolkit.Common.CRMVersion) {
                return WebAPIToolkit.Common.CRMVersion;
            }
                // This is available on the normal CRM forms. If it is not available, the version will be retrieved via the CRM-Message RetrieveVersion()
            else if (!!window["APPLICATION_FULL_VERSION"]) {
                WebAPIToolkit.Common.CRMVersion = window["APPLICATION_FULL_VERSION"];
                return WebAPIToolkit.Common.CRMVersion;
            }
            else {
                // CRM 2016
                var req = new XMLHttpRequest();
                req.open("GET", encodeURI(WebAPIToolkit.Common.Merge(WebAPIToolkit.Common.Merge(Xrm.Page.context.getClientUrl(), "/api/data/v8.2/"), "RetrieveVersion()")), false);
                req.setRequestHeader("Accept", "application/json");
                req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                req.setRequestHeader("OData-MaxVersion", "4.0");
                req.setRequestHeader("OData-Version", "4.0");
                req.setRequestHeader("Prefer", "odata.include-annotations=*");
                req.send();

                WebAPIToolkit.Common.CRMVersion = JSON.parse(req.response).Version;
                return WebAPIToolkit.Common.CRMVersion;
            }
        },
        GetApiURL: function () {
            /// <summary>Gets the current WebAPI-URL</summary>
            /// <returns type="string">WebAPI-URL</returns>
            if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "9.1.0.0") >= 0) {
                var URL = "/api/data/v9.1/";
            }
            else if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "9.0.0.0") >= 0) {
                var URL = "/api/data/v9.0/";
            }
            else if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "8.2.0.0") >= 0) {
                var URL = "/api/data/v8.2/";
            }
            else if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "8.1.0.0") >= 0) {
                var URL = "/api/data/v8.1/";
            }
            else {
                var URL = "/api/data/v8.0/";
            }

            return URL;
        },
        VersionCompare: function (v1, v2) {
            /// <summary>Compares two versionumbers</summary>
            /// <param name="v1" type="string">VersionNr 1</param>
            /// <param name="v2" type="string">VersionNr 2</param>
            /// <returns type="int">-1 : VersionNr1 is smaller than VersionNr 2, 0: Both VersionNrs are equal, 1: VersionNr2 is greater than VersionNr 2</returns>

            // found here: http://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number

            var v1parts = ("" + v1).split("."),
                v2parts = ("" + v2).split("."),
                minLength = Math.min(v1parts.length, v2parts.length),
                p1, p2, i;
            // Compare tuple pair-by-pair. 
            for (i = 0; i < minLength; i++) {
                // Convert to integer if possible, because "8" > "10".
                p1 = parseInt(v1parts[i], 10);
                p2 = parseInt(v2parts[i], 10);
                if (isNaN(p1)) { p1 = v1parts[i]; }
                if (isNaN(p2)) { p2 = v2parts[i]; }
                if (p1 == p2) {
                    continue;
                } else if (p1 > p2) {
                    return 1;
                } else if (p1 < p2) {
                    return -1;
                }
                // one operand is NaN
                return NaN;
            }
            // The longer tuple is always considered 'greater'
            if (v1parts.length === v2parts.length) {
                return 0;
            }
            return (v1parts.length < v2parts.length) ? -1 : 1;
        },
        GetPluralName: function (entity) {
            /// <summary>Gets the pluralname of an entity</summary>
            /// <param name="entity" type="string">Entity</param>
            /// <returns>pluralname of the entity</returns>

            if (!!entity) {
                if (entity[entity.length - 1] == "s" || entity[entity.length - 1] == "x") {
                    return entity + "es";
                }
                else if (entity[entity.length - 1] == "y") {
                    return entity.substr(0, entity.length - 1) + "ies";
                }
                else {
                    return entity + "s";
                }
            }
            return "";
        }
    };
}();

WebAPIToolkit.BusinessEntity = function (LogicalName, ID) {
    ///<summary>
    /// Creates a BusinessEntity-instance which is used for CRUD-operations
    ///</summary>
    ///<param name="logicalName" type="String"> LogicalName of the entity</param>
    ///<param name="id" type="String">ID of the CRM-record</param>

    // Private Propertys
    var id = null;
    var logicalname = "";
    var RetrievedJson = null;
    var JsonObject = {};

    // Begin Constructor 
    if (LogicalName == "" || LogicalName == null) {
        throw new WebAPIToolkit.Exceptions.ArgumentException(WebAPIToolkit.Common.NoLogicalNameSet);
    }
    if (WebAPIToolkit.Common.IsGuid(ID)) {
        id = ID;
    }
    else if (WebAPIToolkit.Common.IsObject(ID)) {
        RetrievedJson = ID;
        JsonObject = ID;
        id = ID["" + LogicalName + "id"]
    }
    logicalname = LogicalName;
    // End Constructor 

    return {
        Contains: function (Field) {
            /// <summary>Reflects true / false whether the Field is available and has a Value</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <returns type="bool">false: Field not available / has no value; true: field is available and has a value</returns>

            return GetField(Field).Value != null ? true : false;
        },
        SetText: function (Field, Value) {
            /// <summary>Sets a textvalue for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="Value" type="string">Text</param>

            JsonObject[Field] = Value;
        },
        SetLookup: function (Field, LogicalName, ID) {
            /// <summary>Sets a lookupvalue for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="LogicalName" type="string">Text or null</param>
            /// <param name="ID" type="string">Text</param>

            if (!!LogicalName) {
                JsonObject["" + Field + "@odata.bind"] = "/" + WebAPIToolkit.Common.GetPluralName(LogicalName) + "(" + ID + ")";
            }
            else {
                JsonObject["" + Field + "@odata.bind"] = null;
            }
        },
        SetLookupExplicit: function (Field, LogicalName, ID) {
            /// <summary>Sets a lookupvalue with an explicit logicalname for a field. This might only be necessary for a very few entities</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="LogicalName" type="string">Text</param>
            /// <param name="ID" type="string">Text</param>

            JsonObject["" + Field + "_" + LogicalName + "@odata.bind"] = "/" + WebAPIToolkit.Common.GetPluralName(LogicalName) + "(" + ID + ")"
        },
        SetDate: function (Field, DateValue) {
            /// <summary>Sets a date for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="DateValue" type="date">Date</param>

            JsonObject[Field] = DateValue;
        },
        SetBoolean: function (Field, BooleanValue) {
            /// <summary>Sets a bool for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="BooleanValue" type="bool">Bool</param>

            JsonObject[Field] = BooleanValue;
        },
        SetInteger: function (Field, IntegerValue) {
            /// <summary>Sets an integer-value for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="IntegerValue" type="int">Integer</param>

            JsonObject[Field] = IntegerValue;
        },
        SetDecimal: function (Field, DecimalValue) {
            /// <summary>Sets a decimal-value for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="DecimalValue" type="float">DecimalValue</param>

            JsonObject[Field] = DecimalValue;
        },
        SetDouble: function (Field, DoubleValue) {
            /// <summary>Sets a double-value for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="DoubleValue" type="float">DoubleValue</param>

            JsonObject[Field] = DoubleValue;
        },
        SetOptionSet: function (Field, OptionSetValue) {
            /// <summary>Sets an OptionSetValue for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="OptionSetValue" type="int">OptionSetValue</param>

            JsonObject[Field] = OptionSetValue;
        },
        SetCurrency: function (Field, CurrencyValue) {
            /// <summary>Sets a CurrencyValue for a field</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <param name="CurrencyValue" type="float">CurrencyValue</param>

            JsonObject[Field] = CurrencyValue;
        },
        GetField: function (Field) {
            /// <summary>Gets the value of a field. It will always be returned an object with the Property Value. If the field is not available or empty, the Value will be null</summary>
            /// <param name="Field" type="string">Name of the field</param>
            /// <returns type='object'>Returns an object with the Property null. If the field is not available or empty, the Value will be null.
            /// Lookup: { Value: ID of the lookup, ID: ID of the lookup, LogicalName: LogicalName of the record, FormattedValue: Text-Value of the lookup }
            /// Other: { Value: Value of the field, FormattedValue: Optional Field if returned by the WebAPI }
            /// Null: { Value : null }</returns>

            var Result = JsonObject[Field] != null ? { Value: JsonObject[Field] } : null;
            if (Result == null && !!JsonObject[Field + "@odata.bind"]) {
                Result = {
                    LogicalName: JsonObject[Field + "@odata.bind"].substr(1, JsonObject[Field + "@odata.bind"].length - 40),
                    ID: JsonObject[Field + "@odata.bind"].substr(JsonObject[Field + "@odata.bind"].length - 37, 36),
                    Value: JsonObject[Field + "@odata.bind"].substr(JsonObject[Field + "@odata.bind"].length - 37, 36),
                }
            }
            else if (Result == null && (!!JsonObject["_" + Field + "_value"] || !!JsonObject[Field + "@Microsoft.Dynamics.CRM.lookuplogicalname"])) {
                var lookupField = !!JsonObject["_" + Field + "_value"] ? "_" + Field + "_value" : Field;
                Result = {
                    ID: JsonObject[lookupField],
                    Value: JsonObject[lookupField],
                    LogicalName: JsonObject[lookupField + "@Microsoft.Dynamics.CRM.lookuplogicalname"],
                    AssociatedNavigationproperty: JsonObject[lookupField + "@Microsoft.Dynamics.CRM.associatednavigationproperty"],
                    FormattedValue: JsonObject[lookupField + "@OData.Community.Display.V1.FormattedValue"]
                };
            }

            if (Result != null && Result.FormattedValue == null && !!JsonObject[Field + "@OData.Community.Display.V1.FormattedValue"]) {
                Result.FormattedValue = JsonObject[Field + "@OData.Community.Display.V1.FormattedValue"];
            }
            if (Result == null) {
                Result = { Value: null };
            }

            return Result;
        },
        GetJson: function () {
            /// <summary>Returns the retrieved JSON-Object</summary>
            /// <returns> Retrieved JSON</returns>

            return JsonObject;
        },
        Update: function (Callback, ErrorHandler) {
            /// <summary>Updates or creates the record. Record will be created when the ID is not set</summary>
            /// <param name="Callback" type="function">Callback</param>
            /// <returns>Result of Update, if there are</returns>

            if (!WebAPIToolkit.Common.IsGuid(id)) {
                return WebAPIToolkit.Web.Create(logicalname, JsonObject, Callback, ErrorHandler);
            }
            else {
                return WebAPIToolkit.Web.Update(logicalname, id, JsonObject, Callback, ErrorHandler);
            }
        },
        RetrievedJson: RetrievedJson,
        ID: id,
        LogicalName: logicalname
    };
};

WebAPIToolkit.Web = function () {
    function HandleRequestResponse(Status, Response, ODataEntityId, Callback, ErrorHandler, entityName, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4) {
        /// <summary>Handles the response of the WebAPI-Call</summary>
        /// <param name="Status" type="string">Status</param>
        /// <param name="Response" type="string/Json">Response-JSON</param>
        /// <param name="ODataEntityId" type="string">ODataEntityId</param>
        /// <param name="Callback" type="function">Callback-method if async</param>
        /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
        /// <param name="entityName" type="string">entityName of the request</param>
        /// <param name="CallbackArgument1" type="object">For internal purposes</param>
        /// <param name="CallbackArgument2" type="object">For internal purposes</param>
        /// <param name="CallbackArgument3" type="object">For internal purposes</param>
        /// <param name="CallbackArgument4" type="object">For internal purposes</param>

        // 200 OK
        if (Status == 200) {
            var TempJson = JSON.parse(Response);
            // Multiple Items
            if (!!entityName) {
                if (TempJson != null && TempJson.value != null && TempJson.value.length != null) {
                    var logicalName = entityName;
                    var Results = [];
                    for (var i = 0; i < TempJson.value.length; i++) {
                        var be = new WebAPIToolkit.BusinessEntity(logicalName, TempJson.value[i]);
                        Results[Results.length] = be;
                    }

                    if (!!Callback) {
                        Callback(Results, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4);
                    }
                    else {
                        return Results;
                    }
                }
                else {
                    // Single Item
                    if (!!Callback) {
                        Callback(new WebAPIToolkit.BusinessEntity(entityName, TempJson, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4));
                    }
                    else {
                        return new WebAPIToolkit.BusinessEntity(entityName, TempJson);
                    }
                }
            }
            else {
                if (!!Callback) {
                    Callback(TempJson);
                }
                else {
                    return TempJson;
                }
            }
        }
            // 204 No Content: Successfully executed but no Content in body
        else if (Status == 200 || Status == 204) {
            var ID = null;
            if (!!ODataEntityId) {
                var ID = ODataEntityId.substr(ODataEntityId.length - 38).substring(1, 37); //get only GUID  
            }

            if (!!Callback) {
                Callback(ID, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4);
            }
            else {
                return ID;
            }
        }
            // Not Modified: 
        else if (Status == 304) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("304:" + error.message);
            }
            else {
                throw "304:" + error.message;
            }
        }
            // Forbidden
        else if (Status == 401) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("401:" + error.message);
            }
            else {
                throw "401:" + error.message;
            }
        }
            // Unauthorized
        else if (Status == 403) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("403:" + error.message);
            }
            else {
                throw "403:" + error.message;
            }
        }
            // Payload Too Large
        else if (Status == 413) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("413:" + error.message);
            }
            else {
                throw "413:" + error.message;
            }
        }
            // BadRequest
        else if (Status == 400) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("400:" + error.message);
            }
            else {
                throw "400:" + error.message;
            }
        }
            // Not Found
        else if (Status == 404) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("404:" + error.message);
            }
            else {
                throw "404:" + error.message;
            }
        }
            // Method Not Allowed
        else if (Status == 405) {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler("405:" + error.message);
            }
            else {
                throw "405:" + error.message;
            }
        }
        else {
            var error = JSON.parse(Response).error;
            console.log(error.message);
            if (!!ErrorHandler) {
                ErrorHandler(error.message);
            }
            else {
                throw error.message;
            }
        }
    }
    // Events
    function ExecuteRequest(Method, Uri, Msg, Callback, ErrorHandler, LogicalName, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4, PagingCookie) {
        /// <summary>Executes the WebAPI-Request</summary>
        /// <param name="Method" type="string">GET / POST / PATCH / DELETE</param>
        /// <param name="Uri" type="string/exception">URI of the request</param>
        /// <param name="Msg" type="string/exception">Message</param>
        /// <param name="Callback" type="function">Callback-method if async</param>
        /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
        /// <param name="LogicalName" type="string">LogicalName</param>
        /// <param name="CallbackArgument1" type="object">For internal purposes</param>
        /// <param name="CallbackArgument2" type="object">For internal purposes</param>
        /// <param name="CallbackArgument3" type="object">For internal purposes</param>
        /// <param name="CallbackArgument4" type="object">For internal purposes</param>
        /// <returns>Result of the request if sync</returns>

        var requestBody = "";
        var contentType = "";
        var encodedUri = "";
        if (Uri.indexOf("fetchXml=<") != -1 && Uri.indexOf("paging-cookie=") != -1) {
            encodedUri = WebAPIToolkit.Common.Merge(WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL()), Uri);
        }
        else {
            encodedUri = encodeURI(WebAPIToolkit.Common.Merge(WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL()), Uri));
        }
        
        var requestUri = "";

        if (Msg === "$batch") {
            contentType = "multipart/mixed;boundary=batch_fetchquery";
            requestBody =
              "--batch_fetchquery\n" +
              "Content-Type: application/http\n" +
              "Content-Transfer-Encoding: binary\n" +
              "\n" +
              "GET " +
              encodedUri +
              " HTTP/1.1\n" +
              'Prefer: odata.include-annotations="*"\n' +
              "\n" +
              "--batch_fetchquery--";
            requestUri = WebAPIToolkit.Common.Merge(WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL()), "$batch");

        } else {
            contentType = "application/json; charset=utf-8";
            requestBody = Msg;
            requestUri = encodeURI(WebAPIToolkit.Common.Merge(WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL()), Uri));
        }

        var req = new XMLHttpRequest();
        req.open(Method, requestUri, !!Callback);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", contentType);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", "odata.include-annotations=*");

        if (Method.toLowerCase() == "post" || Method.toLowerCase() == "patch") {
            req.send(requestBody);
        }
        else {
            req.send();
        }

        if (!!Callback) {
            req.onreadystatechange = function () {
                if (req.readyState == 4) { // "complete"
                    var data = this.responseText;
                    if (Msg === "$batch") {
                        data = this.responseText.substring(this.responseText.indexOf("{"), this.responseText.lastIndexOf("}") + 1);
                    }
                    HandleRequestResponse(this.status, data, this.getResponseHeader("OData-EntityId"), Callback, ErrorHandler, LogicalName, CallbackArgument1, CallbackArgument2, CallbackArgument3, CallbackArgument4);
                }
            };
        }
        else {
            var data = req.response;
            if (Msg === "$batch") {
                data = req.response.substring(req.response.indexOf("{"), req.response.lastIndexOf("}") + 1);
            }

            return HandleRequestResponse(req.status, data, req.getResponseHeader("OData-EntityId"), null, null, LogicalName);
        }
    }
    function decodePagingCookie(pageCookie) {
        /// <summary>Decodes the given pagecookie</summary>
        /// <param name="pageCookie" type="string">pageCookie</param>
        /// <returns>Result</returns>

        var pagingcookie = new DOMParser().parseFromString(pageCookie, "text/xml").getElementsByTagName('cookie')[0].getAttribute('pagingcookie');

        /*double decode and format. */
        var decodedpagingCookie = decodeURIComponent(decodeURIComponent(pagingcookie));
        var decodedpagingCookie = decodeURIComponent(decodedpagingCookie).replace(/&/g, '&amp;').replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

        return decodedpagingCookie;
    }
    function FetchAll(fetchXml, entityName, page, pagingCookie, Callback, ErrorHandler, ResultItems) {
        /// <summary>Fetches all records</summary>
        /// <param name="fetchXml" type="string">FetchXML</param>
        /// <param name="entityName" type="string">entityName</param>
        /// <param name="page" type="integer">number of pagination (1: first)</param>
        /// <param name="pagingCookie" type="string">pagingCookie</param>
        /// <param name="Callback" type="function">Callback-method if async</param>
        /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
        /// <param name="ResultItems" type="array">Resultitems</param>
        /// <returns>Result of the request if sync</returns>


        if (!!Callback) {
            var fetch = fetchXml.replace("<fetch ", "<fetch count='5000' page='" + page + "' paging-cookie='" + pagingCookie + "' ");
            ExecuteRequest("POST", WebAPIToolkit.Common.GetPluralName(entityName) + "?fetchXml=" + encodeURIComponent(fetch), "$batch", function (Result) {

                Result.value.forEach(function (item) { ResultItems[ResultItems.length] = new WebAPIToolkit.BusinessEntity(entityName, item) });
                if (Result['@Microsoft.Dynamics.CRM.morerecords']) {
                    FetchAll(fetchXml, entityName, page + 1, decodePagingCookie(Result['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie']), Callback, ErrorHandler, ResultItems);
                }
                else {
                    Callback(ResultItems);
                }
            }, ErrorHandler, null, null, null, null, null, pagingCookie);
        }
        else {
            var Result = null;
            do {
                var fetch = fetchXml.replace("<fetch ", "<fetch count='5000' page='" + ++page + "' paging-cookie='" + pagingCookie + "' ");
                Result = ExecuteRequest("POST", WebAPIToolkit.Common.GetPluralName(entityName) + "?fetchXml=" + encodeURIComponent(fetch), "$batch", null, null, null, null, null, null, null, pagingCookie);
                Result.value.forEach(function (item) { ResultItems[ResultItems.length] = new WebAPIToolkit.BusinessEntity(entityName, item) });
                pagingCookie = decodePagingCookie(Result['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie']);
            } while (Result['@Microsoft.Dynamics.CRM.morerecords'])

        }
    }
    function GetEntityNameOfFetch(fetchXml) {
        /// <summary>Gets the entityname of the FetchXML</summary>
        /// <param name="fetchXml" type="string">FetchXML</param>
        /// <returns>Found entityname</returns>

        var entityName = "";
        var delimiterFound = false;
        var StartIndex = fetchXml.indexOf("<entity name=");
        for (var i = StartIndex; i < fetchXml.length; i++) {
            if (fetchXml[i] == "'" || fetchXml[i] == "\"") {
                if (delimiterFound) {
                    break;
                }
                delimiterFound = true;
            }
            else if (delimiterFound) {
                entityName += fetchXml[i];
            }
        }

        return entityName.trim();
    }
    function GetServerUrl() {
        /// <summary>Gets the ServerURL</summary>
        /// <returns>ServerURL</returns>

        var clientURL = Xrm.Page.context.getClientUrl();
        return clientURL;
    }

    return {
        Request: function (Method, URI, MSG, callback, ErrorHandler) {
            /// <summary>Sends a WebAPI-Request</summary>
            /// <param name="Method" type="string">GET / POST / PATCH / DELETE</param>
            /// <param name="URI" type="string">URI</param>
            /// <param name="MSG" type="object">JSON</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
            /// <returns>Result of the request if sync</returns>

            return ExecuteRequest(Method, URI, MSG, callback, ErrorHandler);
        },
        Fetch: function (fetchXml, callback, ErrorHandler, All) {
            /// <summary>Sends a FetchXML-request</summary>
            /// <param name="fetchXml" type="string">FetchXML</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
            /// <param name="All" type="bool">default (false), true: returns all records from all pages</param>
            /// <returns>Result of the request if sync</returns>

            var entityName = GetEntityNameOfFetch(fetchXml);
            if (entityName.trim() == "") {
                throw new "entityName not found";
            }

            if (All) {
                FetchAll(fetchXml, entityName, 1, "", callback, ErrorHandler, []);
            }
            else {
                if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "9.0.0.0") >= 0) {
                    return ExecuteRequest("POST", WebAPIToolkit.Common.GetPluralName(entityName) + "?fetchXml=" + fetchXml, "$batch", callback, ErrorHandler, entityName);
                }
                else if (WebAPIToolkit.Common.VersionCompare(WebAPIToolkit.Common.GetVersion(), "8.2.1.207") < 0) {
                    return ExecuteRequest("GET", WebAPIToolkit.Common.GetPluralName(entityName) + "?fetchXml=" + fetchXml, null, callback, ErrorHandler, entityName);
                }
                else {
                    return ExecuteRequest("GET", WebAPIToolkit.Common.GetPluralName(entityName) + "?fetchXml=" + fetchXml, null, callback, ErrorHandler, entityName);
                }
            }
        },
        Retrieve: function (entityName, id, columnSet, callback, ErrorHandler) {
            /// <summary>Retrieves for the given entity a record with the given id and the given columns</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">GUID of the record</param>
            /// <param name="columnSet" type="string">Array of columns; if empty, all columns will be retrieved</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
            /// <returns>Result of the request if sync</returns>

            var select = "";
            if (columnSet != null && columnSet.length > 0) {
                var select = "?$select=";
                for (var i = 0; i < columnSet.length; i++) {
                    select += columnSet[i] + ((i + 1) == columnSet.length ? "" : ",");
                }
            } else {
                select = "?$select=*";
            }


            return ExecuteRequest("GET", WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/" + (!!select ? select : ""), null, callback, ErrorHandler, entityName);
        },
        RetrieveWithParams: function (entityName, id, Params, callback, ErrorHandler) {
            /// <summary>Retrieves for the given entity a record with the given id and the given columns</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">GUID of the record</param>
            /// <param name="Params" type="string">WebAPI-String</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
            /// <returns>Result of the request if sync</returns>

            return ExecuteRequest("GET", WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/" + (!!Params ? "?" + Params : ""), null, callback, ErrorHandler, entityName);
        },
        RetrieveMultiple: function (entityName, query, callback, ErrorHandler) {
            return ExecuteRequest("GET", WebAPIToolkit.Common.GetPluralName(entityName) + (!!query ? "?" + query : ""), null, callback, ErrorHandler, entityName);
        },
        Create: function (entityName, jsonObject, callback, ErrorHandler) {
            /// <summary>Creates a record</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="jsonObject" type="object">JSON</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>
            /// <returns>ID of the created record if sync</returns>

            return ExecuteRequest("POST", WebAPIToolkit.Common.GetPluralName(entityName), JSON.stringify(jsonObject), callback, ErrorHandler, entityName);
        },
        Update: function (entityName, id, jsonObject, callback, ErrorHandler) {
            /// <summary>Updates a record</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">ID of the record</param>
            /// <param name="jsonObject" type="object">JSON</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            var loop = false;
            // Check whether there are empty lookups in the object
            if (jsonObject != null) {
                for (var key in jsonObject) {
                    if (key.indexOf("@odata.bind") != -1 && jsonObject[key] == null) {
                        delete jsonObject[key];
                        if (!!callback) {
                            ExecuteRequest("DELETE", WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/" + key.replace("@odata.bind", "") + "/$ref", null, function (ID, p1, p2, p3, p4) {
                                WebAPIToolkit.Web.Update(p1, p2, p3, p4);
                            }, null, entityName, id, jsonObject, callback, ErrorHandler);
                            loop = true;
                            break;
                        } else {
                            WebAPIToolkit.Web.ClearLookup(entityName, id, key.replace("@odata.bind", ""));
                        }
                    }
                }
            }

            if (!loop) {
                return ExecuteRequest("PATCH", WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/", JSON.stringify(jsonObject), callback, ErrorHandler, entityName);
            }
        },
        Delete: function (entityName, id, callback, ErrorHandler) {
            /// <summary>Deletes a record</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">ID of the record</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            return ExecuteRequest("DELETE", WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/", null, callback, ErrorHandler, entityName);
        },
        Associate: function (relationshipName, targetEntityName, targetId, relatedEntityName, relatedID, callback, ErrorHandler) {
            /// <summary>Associates two records</summary>
            /// <param name="relationshipName" type="string">Name of the relationship</param>
            /// <param name="targetEntityName" type="guid">Logicalname of the target entity</param>
            /// <param name="targetId" type="guid">ID of the target record</param>
            /// <param name="relatedEntityName" type="guid">Logicalname of the related entity</param>
            /// <param name="relatedID" type="guid">ID of the related record</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            return ExecuteRequest("POST", WebAPIToolkit.Common.GetPluralName(targetEntityName) + "(" + WebAPIToolkit.Common.ParseGUID(targetId) + ")/" + relationshipName + "/$ref",
                JSON.stringify({
                    "@odata.id": WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL() + WebAPIToolkit.Common.GetPluralName(relatedEntityName) + "(" + relatedID + ")")
                }), callback, ErrorHandler);
        },
        Disassociate: function (relationshipName, targetEntityName, targetId, relatedEntityName, relatedID, callback, ErrorHandler) {
            /// <summary>Disassociates two records</summary>
            /// <param name="relationshipName" type="string">Name of the relationship</param>
            /// <param name="targetEntityName" type="string">Logicalname of the target entity</param>
            /// <param name="targetId" type="guid">ID of the target record</param>
            /// <param name="relatedEntityName" type="string">Logicalname of the related entity</param>
            /// <param name="relatedID" type="guid">ID of the related record</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            return ExecuteRequest("DELETE", WebAPIToolkit.Common.GetPluralName(targetEntityName) + "(" + WebAPIToolkit.Common.ParseGUID(targetId) + ")/" + relationshipName + "/$ref?$id=" +
                WebAPIToolkit.Common.Merge(GetServerUrl(), WebAPIToolkit.Common.GetApiURL() + WebAPIToolkit.Common.GetPluralName(relatedEntityName) + "(" + relatedID + ")"), null, callback, ErrorHandler);
        },
        SetState: function (entityName, id, stateCode, statusCode, callback, ErrorHandler) {
            /// <summary>Sets the state of a record</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">ID of the entity</param>
            /// <param name="stateCode" type="int">StateCode value</param>
            /// <param name="statusCode" type="int">StatusCode value</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            return WebAPIToolkit.Web.Update(entityName, id, {
                statecode: stateCode,
                statuscode: statusCode
            }, callback, ErrorHandler, entityName);
        },
        Assign: function (entityName, id, assigneeEntityName, assigneeId, callback, ErrorHandler) {
            /// <summary>Assigns a record to a user or team</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">ID of the entity</param>
            /// <param name="assigneeEntityName" type="int">systemuser or team</param>
            /// <param name="assigneeId" type="int">assigneeId</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            if (assigneeEntityName.toLowerCase().trim() != "systemuser" && assigneeEntityName.toLowerCase().trim() != "team") {
                throw new WebAPIToolkit.Exceptions.ArgumentException(WebAPIToolkit.Common.IncorrectLogicalnameForAssignment);
            }

            var be = new WebAPIToolkit.BusinessEntity(entityName, id);
            be.SetLookup("ownerid", assigneeEntityName, assigneeId);
            be.Update(callback, ErrorHandler);
        },
        ClearLookup: function (entityName, id, field, callback, ErrorHandler) {
            /// <summary>Clears a lookup in a record</summary>
            /// <param name="entityName" type="string">Logicalname of the entity</param>
            /// <param name="id" type="guid">ID of the record</param>
            /// <param name="field type="string">Lookup-field</param>
            /// <param name="Callback" type="function">Callback-method if async</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            return ExecuteRequest("DELETE",
                WebAPIToolkit.Common.GetPluralName(entityName) + "(" + WebAPIToolkit.Common.ParseGUID(id) + ")/" + field + "/$ref", null, callback, ErrorHandler, entityName);
        },
        ExecuteWorkflow: function (workflowId, targetRecordId, callback, ErrorHandler) {
            /// <summary>Executes a workflow</summary>
            /// <param name="onSuccess" type="function">Callback on success</param>
            /// <param name="onError" type="function">Callback on error</param>
            /// <param name="workflowId" type="guid">ID of the workflow record</param>
            /// <param name="targetRecordId" type="guid">ID of the target record</param>
            /// <param name="ErrorHandler" type="function">Error-Callback-method if async</param>

            if (!!workflowId && !!targetRecordId) {

                var jsonObject = {
                    "EntityId": targetRecordId
                }

                return ExecuteRequest("POST", "workflows(" + workflowId + ")/Microsoft.Dynamics.CRM.ExecuteWorkflow", JSON.stringify(jsonObject), callback, ErrorHandler);
            }
            else {
                throw "No given Workflow Id or/and Target record Id";
            }
        },
    };

}();


