 Web-API Toolkit: JavaScript library to work with the WebAPI for Microsoft Dynamics CRM 2016 / Dynamics 365

Web-API Toolkit is a JavaScript library to help developers using the WebAPI which has been released with
Microsoft Dynamics CRM 2016. This API is designed to simplify the work with the Web-API of CRM 2016. 
The design of the interface is on purpose similar to the XrmServiceToolkit. This is meant to help developers 
get used to this API faster.

Credits:

To the company ascendit (www.ascendit.de) for supporting this project

The idea of this library was inspired by the XrmServiceToolkit (https://xrmservicetoolkit.codeplex.com/)

*****************************************************************************************************************
Version 1.0.0.0: 
 - Support for all CRUD-operations
 - Support for assigning records and set the state of records.
*****************************************************************************************************************
Version 1.0.0.1: 
 - Bugfix: Missing calling of callback-function in raw execute statements
*****************************************************************************************************************
Version 1.0.0.2: 
 - Since CRM V.8.2.1.207 the retrievement of fetchXML does not need twice encodeURIComponent anymore
*****************************************************************************************************************
Version 1.0.0.3: 
 - Since CRM V.9.x the retrievement of fetchXML is made with a batchrequest (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/webapi/execute-batch-operations-using-web-api)
*****************************************************************************************************************
Version 1.0.0.4: 
 - Adding Errorhandling for all asynchronous calls
 - Added function ExecuteWorkflow()
 - Added new parameter for Fetch(): 
       All: Retrieves all records for all pages for the given query
 **MIRGATION to 1.0.0.4**
 .> Since CRM 9.0 the result of a LinkedEntity + attribute is returned differently. 
    Instead of <Alias>_x002e_<Attribute> the result is <Alias>.<Attribute>. Adjust your code accordingly.
*****************************************************************************************************************
