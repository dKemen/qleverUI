/**
 * Created by buchholb on 3/31/15.
 * Extended by Daniel Kemen and Julian Bürklin 7/2017
 */
var example = 0;
var activeState = 1;
var subjectNames = {}
var predicateNames = {}
var objectNames = {}

$(document).ready(function() {

	// initialize code mirror
    editor = CodeMirror.fromTextArea(document.getElementById("query"), {
        mode: "application/sparql-query", indentWithTabs: true, smartIndent: false,
        lineNumbers: true, matchBrackets: true, autoCloseBrackets: true,
        autofocus: true, styleSelectedText: true, styleActiveLine: true,
        extraKeys: {
            "Ctrl-Enter": function(cm) { $("#runbtn").trigger('click'); },
            "Space": function(cm) {
                var cursor = editor.getDoc().getCursor();
                var pos = { line: cursor.line, ch: cursor.ch }
                editor.replaceRange(" ", pos);
                CodeMirror.commands.autocomplete(editor);
            },
            "Tab": function(cm) { switchStates(cm); },
            "Ctrl-Space": "autocomplete",
        },
    });
    
    // set the editor size
    editor.setSize($('#queryBlock').width());

	// make the editor resizable
    $('.CodeMirror').resizable({
        resize: function() {
	        // fix the "help"-box position on resize
            $('#help').css({ 'margin-top':  $(this).width() > 740 ? $(this).height() + 10 : 0 }); 
            editor.setSize($(this).width(), $(this).height());
        }
    });

	// initialize the tooltips
    $('[data-toggle="tooltip"]').tooltip();

	// if there is a theme cookie: use it!
    if (getCookie("theme") != "") {
        changeTheme(getCookie("theme"));
    }

	// load the backends statistics
    handleStatsDisplay();

	// initialize the name hover
    if (SUBJECTNAME || PREDICATENAME || OBJECTNAME) {
        $('.cm-entity').hover(showRealName);
    }

	// initializing done
    console.log('Editor initialized.');

	// Do some custom activities (overwrite codemirror behaviour)
    editor.on("keyup", function(instance, event) {
	    
	    // (re)initialize the name hover
        if (SUBJECTNAME || PREDICATENAME || OBJECTNAME) {
            $('.cm-entity').hover(showRealName);
        }
		
		// do not overwrite ENTER inside an completion window
        if (instance.state.completionActive || event.keyCode == 27) {
            return;
        }
        
        // TODO: find a general function to gather this information
        var cur = instance.getCursor();
        var line = instance.getLine(cur.line);
        var token = instance.getTokenAt(cur);
        var string = '';

        if (token.string.match(/^[.`\w?<@]\w*$/)) {
            string = token.string;
        }
        
        // do not suggest anything inside a word
        if (line[cur.ch] == " " || line[cur.ch + 1] == " " || line[cur.ch + 1] == undefined) {
           
			// invoke autocompletion after a very short delay
            window.setTimeout(function() {
                if (example == 1) { example = 0; } else {
                    CodeMirror.commands.autocomplete(instance);
                }
            }, 150);

        } else {
            console.warn('Skipped completion due to cursor position');
        }
    });

	// when completion is chosen - remove the counter badge
    editor.on("endCompletion", function() { $('#aBadge').remove(); });

    function showRealName(element) {
	   	    
        // collect prefixes (as string and dict)
        // TODO: move this to a function. Also use this new function in sparql-hint.js
	    var prefixes = "";
	    var lines = getContextByName('PrefixDecl')['content'].split('\n');
	
	    for (var line of lines) {
	        if (line.trim().startsWith("PREFIX")) {
	            var match = /PREFIX (.*): ?<(.*)>/g.exec(line.trim());
	            if (match) {
	                prefixes += line.trim()+'\n';
	            }
	        }
	    }
		
		// TODO: move this "get current element with its prefix" to a function. Also use this new function in sparql-hint.js
        values = $(this).parent().text().trim().split(' ');
        element = $(this).text().trim();
        domElement = this;

		// TODO: do something like this to add hover to prefixes 
		/*
		word = editor.getTokenAt(cur);
	    var types = [];
	    if(word.type){
	 	   types = word.type.split(' ');
	 	}
	    // used tokenizer data to find the current word with its prefix
	    if(types.indexOf('prefixed-entity') != -1){
		    if(types.indexOf('entity-name') != -1){
			    word = editor.getTokenAt({ch:word.start-1 ,line: cur.line}).string+word.string;
			} else if(types.indexOf('prefix-name') != -1){
				word = word.string+editor.getTokenAt({ch:word.end+1 ,line: cur.line}).string;
			}
	    } else {
		    word = word.string;
	    }
		*/
		
        if ($(this).prev().hasClass('cm-prefix')) {
            element = $(this).prev().text() + element;
        }

        index = values.indexOf(element);
        if (index == 0) {
            addNameHover(element,domElement,subjectNames,SUBJECTNAME,prefixes);
        } else if (index == 1) {
            addNameHover(element,domElement,predicateNames,PREDICATENAME,prefixes);
        } else if (index == 2) {
	        addNameHover(element,domElement,objectNames,OBJECTNAME,prefixes);
        }

        return true;
    }

    $("#runbtn").click(function() {
        console.log('Start processing');
        processQuery(getQueryString() + '&send=100', true, this);
        
        // generate pretty link
        $.post('/api/share',{'content':editor.getValue()}, function(result) {
            console.log('Got pretty link from backend');
            window.history.pushState("html:index.html", "QLever", window.location.origin + window.location.pathname.split('/').slice(0, 2).join('/') + '/' + result.link);
        },'json');

        if (editor.state.completionActive) { editor.state.completionActive.close(); }
        $("#runbtn").focus();
    });

    $("#csvbtn").click(function() {
        console.log('Download CSV');
        window.location.href = getQueryString() + "&action=csv_export";
    });

    $("#tsvbtn").click(function() {
        console.log('Download TSV');
        window.location.href = getQueryString() + "&action=tsv_export";
    });

});

function addNameHover(element,domElement, list, namepredicate, prefixes){
	if (list[element] != undefined) {
        if (list[element] != "") {
            $(domElement).tooltip({ title: list[element] });
        }
    } else {
        query = prefixes + "SELECT ?name WHERE {\n " + element + " " + namepredicate + " ?name }";
        $.getJSON(BASEURL + '?query=' + encodeURIComponent(query), function(result) {
            if (result['res'] && result['res'][0]) {
                $(domElement).tooltip({ title: result['res'][0] });
                window.setTimeout(function() {
                    $(domElement).trigger('mouseenter');
                }, 100);
                list[element] = result['res'][0];
            } else {
                list[element] = "";
            }
        });
    }
}

function processQuery(query, showStatus, element) {

    console.log('Preparing query...');
    if (showStatus != false) displayStatus("Waiting for response...");
    
    $(element).find('.glyphicon').addClass('glyphicon-spin glyphicon-refresh');
    $(element).find('.glyphicon').removeClass('glyphicon-remove');
    $(element).find('.glyphicon').css('color', $(element).css('color'));
    maxSend = 0;
    var sInd = window.location.href.indexOf("&send=");
    if (sInd > 0) {
        var nextAmp = window.location.href.indexOf("&", sInd + 1);
        if (nextAmp > 0) {
            maxSend = parseInt(window.location.href.substr(sInd + 6, nextAmp - (sInd + 6)))
        } else {
            maxSend = parseInt(window.location.href.substr(sInd + 6))
        }
    }
    console.log('Sending request...');
    $.getJSON(query, function(result) {
        console.log('Evaluating and displaying results...');

        $(element).find('.glyphicon').removeClass('glyphicon-spin');
        if (showStatus != false) {

            if (result.status == "ERROR") { displayError(result); return; }
            var res = '<div id="res"><div id="time"></div>';
            var nofRows = result.res.length;
            $('#resultSize').html(result.resultsize);
            $('#totalTime').html(result.time.total);
            $('#computationTime').html(result.time.computeResult);
            $('#jsonTime').html((parseInt(result.time.total.replace(/ms/, "")) -
                parseInt(result.time.computeResult.replace(/ms/, ""))).toString() + 'ms');
            
            if (maxSend > 0 && maxSend <= nofRows && maxSend < parseInt(result.resultsize)) {
                res += "<div class=\"pull-right\"><button class=\"btn btn-default\" disabled><i class=\"glyphicon glyphicon-eye-close\"></i> Output limited to " + maxSend.toString() + " results.</button>  <a class=\"btn btn-default\" href=\"" + window.location.href.substr(0, window.location.href.indexOf("&")) + "\"><i class=\"glyphicon glyphicon-sort-by-attributes\"></i> Show all " + result.resultsize + " results</a></div><br><br><br>";
            }
            var selection = /SELECT(?: DISTINCT)?([^]*)WHERE/.exec(decodeURIComponent(result.query.replace(/\+/g, '%20')))[1];

            selection = decodeURIComponent(selection.trim())

            indentation = 0;
            remainder = "";
            columns = result.selected;

            var tableHead = $('#resTable thead');
            var head = "<tr><th></th>";
            for (var column of columns) {
                if (column) { head += "<th>" + column + "</th>"; }
            }
            head += "</tr>";
            tableHead.html(head)
            ;
            var tableBody = $('#resTable tbody');
            tableBody.html("");
            var i = 0;
            for (var resultLine of result.res) {
                var row = "<tr>";
                row += "<td>" + i + "</td>";
                var j = 0;
                for (var resultColumn of resultLine) {
                    // GROUP_CONCAT
                    if ($('#resTable thead tr').children('th')[j + 1].innerHTML.startsWith('(GROUP_CONCAT')) {
                        match = (/separator[\s]?=[\s]?\"(.*)\"/g).exec($('#resTable thead tr').children('th')[j + 1].innerHTML);
                        (match && match[1]) ? sep = match[1] : sep = "";
                        results = resultColumn.split(sep);
                        row += "<td><span data-toggle='tooltip' title=\"" + htmlEscape(resultColumn).replace(/\"/g, "&quot;") + "\">"
                        for (var resultColumnValues of results) {
                            row += htmlEscape(getShortStr(resultColumnValues, 50, j)) + "<br>";
                        }
                        if (results.length > 5) {
                            row += "<a onclick=\"showAllConcats(this,'" + sep + "','" + j + "')\">... and " + (results.length - 5) + " more.</a>";
                        }
                        row += "</span></td>";
                    } else {
                        if (resultColumn) {
                            row += "<td><span data-toggle='tooltip' title=\"" + htmlEscape(resultColumn).replace(/\"/g, "&quot;") + "\">" +
                                htmlEscape(getShortStr(resultColumn, 50, j)) +
                                "</span></td>";
                        } else {
                            row += "<td><span>-</span></td>";
                        }
                    }
                    j++;
                }
                row += "</tr>";
                tableBody.append(row);
                i++;
            }
            $('[data-toggle="tooltip"]').tooltip();
            $('#infoBlock,#errorBlock').hide();
            $("#answer").html(res);
            $('#answerBlock').show();
            $("html, body").animate({
                scrollTop: $("#resTable").scrollTop() + 500
            }, 500);

        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var disp = "Connection problem...";
        $('#errorReason').html(disp);
        $('#errorBlock').show();
        $('#answerBlock,#infoBlock').hide();
        $(element).find('.glyphicon').removeClass('glyphicon-spin glyphicon-refresh');
        $(element).find('.glyphicon').addClass('glyphicon-remove');
        $(element).find('.glyphicon').css('color', 'red');
    });

}

function handleStatsDisplay() {
    console.log('Loading backend statistics...');
    $('#statsButton').html('<i class="glyphicon glyphicon-stats"></i> Loading information...');
    $('#statsButton').attr('disabled', 'disabled');

    $.getJSON(BASEURL + "?cmd=stats", function(result) {
        console.log('Evaluating and displaying stats...');
        $("#kbname").html(tsep(result.kbindex));
        $("#textname").html(tsep(result.textindex));
        $("#ntriples").html(tsep(result.noftriples));
        $("#nrecords").html(tsep(result.nofrecords));
        $("#nwo").html(tsep(result.nofwordpostings));
        $("#neo").html(tsep(result.nofentitypostings));
        $("#permstats").html(result.permutations);
        if (result.permutations == "6") {
            $("#kbstats").html("Number of subjects: <b>" +
                tsep(result.nofsubjects) + "</b><br>" +
                "Number of predicates: <b>" +
                tsep(result.nofpredicates) + "</b><br>" +
                "Number of objects: <b>" + tsep(result.nofobjects) + "</b>");
        }
        $('#statsButton').removeAttr('disabled');
        $('#statsButton').html('<i class="glyphicon glyphicon-stats"></i> Toggle backend statistics');
    }).fail(function() {
        $('#statsButton').html('<i class="glyphicon glyphicon-remove" style="color: red;"></i> Unable to connect to backend');
    });
}
