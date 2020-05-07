/* ------------------

BDI's Content Engine - A front end web application for automating email marketing campaigns, registrant, sales, and client communication drafting.

Author: Luke Greaves
Github: @lukegreaves5
Tools & libraries used: HTML, CSS, SCSS, JavaScript, jQuery, Airtable's API, Underscore.js

------------------ */

// -- AIRTABLE KEYS --
const $airtableEvents = "https://api.airtable.com/v0/appdISq2lodl6vyot/Events/",
$k = "api_key=keyxV8TiVBBweSkZ5",
$airtableEventsSorted = "https://api.airtable.com/v0/appdISq2lodl6vyot/Events?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine&sort%5B0%5D%5Bfield%5D=Event%20Date",
$airtableEmails = "https://api.airtable.com/v0/appdISq2lodl6vyot/Messages & Templates?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine - Virtual",
$airtableTodayEmails = "https://api.airtable.com/v0/appdISq2lodl6vyot/Emails?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine"
// ------

// -- GLOBAL VARIABLES -- 
let $inputs_container = $('#frontpage-container'),
$eventSearch = $("#eventsearch"),
$select = $("#select"),
$eventSelect = $('#event-select'),
$messageTypeSelect = $('#message-type'),
$messageNameSelect = $('#message-name'),
$draft_button = $('#draft-button'),
$draft_container = $('#drafted-container'),
$drafts = $('#drafts'),
$mainContainer = $("#main-container"),
$draftContainer = $("#draft-container"),
$predraftContainer = $("#predraft-container"),
option = document.createElement('option'),
list = document.createElement('li'),
optionSelected = null,
predraftedHTML = $("#predraftHTML"),
$eventOptions = [],
$messageTypeOptions = [],
$messageNameOptions = [],
$panelOptions = ["Full Sequence", "1.1", "1.2", "1.3", "1.4"],
$RegistrantRecruitmentOptions = ["Full Sequence", "1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "4.1",],
$RegistrantCommunicationOptions = ["Final Confirmation / Per my Voicemail", "Thanks for attending", "Sorry we missed you", "One week Reminder (Confirmed)", "One week Reminder (Tentaive)"],
$selectedEvent = [],
$selectedMessageType = "",
$selectedMessageName = "",
loader = "<div class='load-pulse'><div class='title-pulse'></div><div class='messages-pulse'></div></div>",
messagesloading = $("#todays-drafts").append(loader,loader,loader,loader);
// ------

$("#custom-drafts-button").click(function(){
  $predraftContainer.css("display", "none");
  $draftContainer.css("display", "flex");
  $(this).css("color", "#6ac7c2");
  $(this).css("background", "#fff");
  $("#todays-drafts-button").css("background", "#66cada");
  $("#todays-drafts-button").css("color", "#fff");
  $("#predrafted-preview").empty();
  $("#predrafted-preview").css("background", "transparent");
  $("#predrafted-preview").append("<div id='logo-container'><div id='logo'></div><div><b>Virtual Events</b></div></div>");
});

$("#todays-drafts-button").click(function(){
  $predraftContainer.css("display", "flex");
  $draftContainer.css("display", "none");
  $(this).css("color", "#6ac7c2");
  $(this).css("background", "#fff");
  $("#custom-drafts-button").css("background", "#66cada");
  $("#custom-drafts-button").css("color", "#fff");
});

// -- GET request from Airtable for all email campaigns to be drafted today, filtered for campaigns that have already been drafted or sent.
// -- This request returns undrafted sequences for today from Airtable
let $todaysEmails = $.ajax({
  url: $airtableTodayEmails,
  type: 'GET',
  success: function(data) {
  let $unsentEmails = [];
  data.records.map( record => {
    if (record.fields.Sender == undefined) {
      return;
    } else if (record.fields.Status == null || record.fields.Status == "Not Started") {
      $unsentEmails.push(record);
    };
  });
  todaysEmails_unsent($unsentEmails);
  },
});
// ------

// Today's undrafted email campaigns filtered by sender.
// So whoever has to send messages today, they have an accordion tab created on the front page.
function todaysEmails_unsent(data) {
  let $senders = [];
  let $sendersObjs = _.uniq(data, record => record.fields.Sender.name);
  $sendersObjs.map(obj => {
    return $senders.push({
      sender: obj.fields.Sender.name,
      number:"",
      messageNames: [],
    });
  });

  $senders.map( sender => {
     sender.number = getOccurrence(data, sender.sender)
    });

  data.map( record => {
    if ($senders.map(sender => {return sender.sender}) == (record.fields.Sender.name)) {
      return $senders.map(sender => {sender.messageNames.push(record.fields.Email)});
    };
  });

  function ifOutreachTypeNull(record) {
    if (record.fields["Message Type"] == "See You Today" || record.fields["Message Type"] == "Thank You for Attending" || record.fields["Message Type"] == "Sorry We Missed You" || record.fields["Message Type"] == "Final Confirmation" || record.fields["Message Type"] == "One Week Reminder") {
      return "Registrant Communication";
    } else return record.fields["Message Type"];
};

  function ifOutreachNameNull(record) {
      if (record.fields["Outreach #"] == null || record.fields["Outreach #"] == undefined) {
        return record.fields["Message Type"];
      } else if (record.fields["Outreach #"] == "Confirmed") {
        return "One Week Reminder (Confirmed)";
      } else if (record.fields["Outreach #"] == "Tentative") {
        return "One Week Reminder (Tentative)";
      } else return record.fields["Outreach #"];
  };


  // An object is created for each sender and they are given an array of message objects filtered from Airtable if their name matches the sender field from Airtable.
  let arr = [];
  $senders.map(sender => {
    data.filter(function(record) {
      if (record.fields.Sender.name == sender.sender) { // if email campaign sender matches the sender object's name.
        arr.push({
        emailName: record.fields.Email,
        eventRecordId: record.fields.Events,
        messageType: ifOutreachTypeNull(record),
        messageName: ifOutreachNameNull(record),
        sender: sender.sender,
        });
      };
    });
  });

  // console.log(data); -- log all messages (Airtable message objects) that need to be sent today. (Command+Shift+C -> Terminal to view them all)
  // console.log($senders); -- log all senders (sender objects) for today.

  $senders.map(sender => {
    sender.messageNames.push(_.where(arr, {sender: sender.sender}));
  });

  if ($senders.length == 0) {
    $("#todays-drafts").empty();
    $("#todays-drafts").append("<div class='all-messages-drafted'>All messages drafted for today.</div>");
    $draftContainer.css("display", "flex");
    $predraftContainer.css("display", "none");
    $("#todays-drafts-button").css("background", "#66cada");
    $("#todays-drafts-button").css("color", "#fff");
    $("#custom-drafts-button").css("background", "#fff");
    $("#custom-drafts-button").css("color", "#66cada");

  } else {
      $("#todays-drafts").empty();
      $senders.map(sender => {
        function ifSendersIsOne(){
          if ($senders.length == 1){
            return sender.messageNames[sender.messageNames.length -1];
          } else return sender.messageNames[0];
        };
        let senderContainer = document.createElement('ul');
        senderContainer.className = "accordion";
        let accordionList = document.createElement('li');
        senderContainer.append(accordionList);
        let senderTitle = document.createElement('a');
        senderTitle.className = "toggle";
        senderTitle.href = "javascript:void(0);";
        senderTitle.innerHTML = "<p class='name'>" + "<span class='first'>" + sender.sender + "</span>" + "<span class='second'><i class='fa fa-caret-down'></i></span></p>" + "<span>" + messagesLength(sender.number);
        accordionList.append(senderTitle);
        let innerList = document.createElement('ul');
        innerList.className = "inner";
        accordionList.append(innerList);
        ifSendersIsOne().map(obj => {
          let messageName = document.createElement('li')
          messageName.className = "predrafted-message";
          messageName.innerHTML = "<i class='fa fa-paper-plane'></i>" + " " + obj.emailName;
          messageName.setAttribute("eventRecord", obj.eventRecordId);
          messageName.setAttribute("messageType", obj.messageType);
          messageName.setAttribute("messageName", obj.messageName);
          return innerList.append(messageName);
        });
        $("#todays-drafts").append(senderContainer);
      });
    };

  function messagesLength(number) { // This corrects the grammar of the message text - changes message to messages if there is more than one message to send
    if (number <= 1) {
      return "<i class='fa fa-envelope-open-text'></i>" + " " + number + " undrafted message" + "</span>";
    } else return "<i class='fa fa-envelope-open-text'></i>" + " " + number + " undrafted messages" + "</span>";
  };
  
  $('.toggle').click(function(e) { // This controls the click event for the senders
    e.preventDefault();
    let $this = $(this);
    if ($this.next().hasClass('show')) {
        $this.next().removeClass('show');
        $this.next().slideUp(350);
    } else {
        $this.parent().parent().find('li .inner').removeClass('show');
        $this.parent().parent().find('li .inner').slideUp(350);
        $this.next().toggleClass('show');
        $this.next().slideToggle(350);
    }
  });

  $("li .predrafted-message").click(function(e){
    let thisRecord = $(this).attr("eventrecord");
    let thisMessageType = $(this).attr("messagetype");
    let thisMessageName = $(this).attr("messagename");
    console.log("Selected event record: " + thisRecord);
    console.log("Selected message type: " + thisMessageType);
    console.log("Selected message name: " + thisMessageName);

    $.ajax({ // Once the sender has been clicked, an additional GET request is sent to Airtable to retrieve the individual message matching the one clicked on
      url: $airtableEvents + thisRecord + "?" + $k,
      type: 'GET',
      success: function(data) {
      $selectedEvent = [];
      $selectedEvent.push(data);
      // console.log($selectedEvent); -- log all selected message data (Airtable object)
      $("#predrafted-preview").empty();
      $("#predrafted-preview").css("background", "#fff");
      optionSelected = null;
      optionSelected = thisRecord;
      $selectedMessageType = thisMessageType;
      $selectedMessageName = thisMessageName;
      $("#predrafted-preview").append(predraftedHTML);
      predraftedHTML.html("");
      predraftedHTML.css("display", "block");
      createDrafts();
      $draft_container.css("display", "none");
      },
    });

  });
};
// ------

function getOccurrence(array, value) {
  let count = 0;
  array.forEach((object) => (object.fields.Sender.name === value && count++));
  return count;
};

let $getEvents = $.ajax({
  url: $airtableEventsSorted,
  type: 'GET',
  success: function(data) {
  $eventOptions.push(data);
  createEventOptions(data);
  },
});

function createEventOptions(data) {
  data.records.map( (d) =>{
    let option = document.createElement('option');
    option.setAttribute("record", d.id);
    option.value = d.fields.Name;
    option.innerHTML = d.fields.Name;
    $eventSelect.append(option);
});
};

function eventSelected() {
  $eventSelect.change(function () {
    optionSelected = null;
    optionSelected = $(this).find("option:selected");

    $.ajax({
    url: $airtableEvents + optionSelected[0].attributes.record.value + "?" + $k,
    type: 'GET',
    success: function(data) {
    $selectedEvent.push(data);
    console.log($selectedEvent);
    },
  });

});
};

  const messageTypeSelected = $messageTypeSelect.change(function () {
    optionSelected = null;
    optionSelected = $(this).find("option:selected");
    $selectedMessageType = optionSelected[0].attributes.value.value;
    console.log($selectedMessageType);

      $.ajax({
        url: $airtableEmails,
        type: 'GET',
        success: function(data) {
        createMessageNameOptions(data, $selectedMessageType)
        $messageNameOptions.push(data.records);

        }
      });
  });

    function createMessageNameOptions(data, messageType) {
      data.records.map( (d) => {
      if (d.fields["Content Hub"].includes(messageType)) {
        let option = document.createElement('option');
        option.value = d.fields.Name;
        option.innerHTML = d.fields.Name;
        $messageNameSelect.append(option);
      }
    });
    };

    const messageNameSelected = $messageNameSelect.change(function () {
      optionSelected = $(this).find("option:selected");
      $selectedMessageName = optionSelected[0].attributes.value.value;
      console.log($selectedMessageName);
    });

    $draft_button.on('click', () =>  {
      if ($eventSelect[0].value == "Event") {
        $eventSelect.css("border", "solid 2px red");
        return;
      } else if ($messageTypeSelect[0].value == "Message Type"){
        $messageTypeSelect.css("border", "solid 2px red");
        return;
      } else if ($messageNameSelect[0].value == "Outreach #"){
        $messageNameSelect.css("border", "solid 2px red");
        return;
      } else 
      createDrafts();
      $inputs_container.css("display", "none");
    });

    // -- This is where the drafts are created and are assigned data from Airtable.
    function createDrafts() {
      let $event = $selectedEvent[0].fields;
      console.log($event); // -- log all selected message data (Airtable object)
      $draft_container.css("display", "flex");
      $drafts.css("visibility", "visible");

      const $missing_fields = [];

      let $fetch_records = [],
      $fetched_records = [],
      $event_name = objectCheck(['Name']),
      $event_client = objectCheck(['client_api']),
      $event_onSite = objectCheck(['On Site']),
      $event_account_manager = "", // $event['AM_api'][0].name
      $event_account_director = objectCheck(['AD']),
      $event_format = objectCheck(["Event Format"]),
      $event_city = objectCheck(['city_api']),
      $event_full_title = objectCheck(['Full Title']),
      $event_short_title = objectCheck(['Short Title']),
      $event_date_month_and_number = objectCheck(['Copy Date']),
      $event_long_date = objectCheck(['Weekday']) + ", " + $event_date_month_and_number,
      $event_date_full_numeric = objectCheck(['Event Date']),
      $event_day_number = objectCheck(['Day #']),//.toString().replace("0", ""))),
      $event_weekday = objectCheck(['Weekday']),
      $weekday_before = weekday_before($event_weekday),
      $event_month = getMonth($event_date_month_and_number),
      $event_month_number = objectCheck(['Month #']),
      $event_snippet = objectCheck(['Content Snippet']),
      $event_content_2 = objectCheck(['Content Snippet 2']),
      $event_promo_reg_list = objectCheck(['PromoRegList']),
      $event_moderator_full_name = objectCheck(['moderator_api']),
      $event_moderator_company = objectCheck(['Moderator Company']),
      $event_venue_address = objectCheck(['(Map) Venue Address']),
      $event_audience = objectCheck(['Audience']),
      $event_target = objectCheck(['Target #']),
      $event_benefit = objectCheck(['Benefit']), //$event.Benefit,
      $event_audience_and_size = objectCheck(['Target #']) + " " + objectCheck(['Audience']),
      $event_venue = objectCheck(['venue_api']),
      $event_parking = objectCheck(['parking_api']),
      $event_website = objectCheck(['website_api']),
      $event_survey = "https://airtable.com/shrvy749ZtQCE9gJ6", //objectCheck(['Survey']),
      $event_panelists_first_name = objectCheck(['speakers_first_name_api']),
      $event_panelists_last_name = objectCheck(['speakers_last_name_api']),
      $event_panelists_titles = objectCheck(['speakers_title_api']),
      $event_panelists_companies = objectCheck(['speakers_companies_api']),
      $event_panelists_full_formatted = objectCheck(['Formatted_speakers_details_api']),
      $event_moderator_full_formatted = objectCheck(['Formatted_moderator_details_api']),
      $event_panelists_title_and_company = objectCheck(['Formatted_speakers_title_company_api']),
      $event_virtual_link = objectCheck(['Zoom Link']),
      $event_days_away = objectCheck(['Days Away']),
      $event_target_copy = objectCheck(['Target']),
      $event_target_region = objectCheck(['Region']),
      $event_target_vertical = objectCheck(['Vertical']),
      $event_timezone = objectCheck(['Timezone']);

      function objectCheck(propCheck) {
        if($event.hasOwnProperty(propCheck)) {
          return $event[propCheck];
        } else {
          $missing_fields.sort().push(propCheck.toString());
          return "<span style='background-color:yellow;text-transform:uppercase;'> MISSING " + propCheck + "</span>";
        };
      };

      function addDateSuffix(d) {
          if (d > 3 && d < 21) return 'th';
          switch (d % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
          }
      };

      function getMonth(sentence) {
        let getFirstWord = sentence.replace(/ .*/,'');
        return getFirstWord;
      };

      function weekday_before(day) {
        if(day == "Tuesday") {
          return "Monday"
        } else if (day == "Wednesday") {
          return "Tuesday"
        }  else if (day == "Thursday") {
          return "Wednesday"
        }
      };
    
      function customReplace(string, replaceThis, withThis) {
        if (string.includes(replaceThis) == true) {
          return string.replace(replaceThis, withThis);
        } else return string;
      };

      console.log($missing_fields);

      function doesThisObjectExist(object_key) {
        return object_key !== undefined ? $event_account_manager == $event['AM_api'][0].name : $event_account_manager = "";
      }

      doesThisObjectExist($event["AM_api"][0].name);      

      function isBlank(variable) {
        if (variable == undefined || variable == null || variable == "") {
          return "<span style='background-color: yellow'> </span>"
        } else return variable;
      }

      function highlight_This(word_To_Highlight) {
        return "<span style='background-color: yellow'>" + word_To_Highlight + "</span>"
      };

      function sort_array_add_and(arr){
        let outStr = "";
        if (Array.isArray(arr) == true) {
          if (arr.includes("yellow") == false) {
            if (arr.length == 0) { 
              outStr = arr;
            } else if (arr.length == 1) {
                outStr = arr[0];
            } else if (arr.length == 2) {
                arr.sort();
                outStr = arr.join(' and ');
            } else if (arr.length > 2) {
                arr.sort();
                outStr = arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1);
            }; 
            return outStr;
          } else return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>";
        } else return arr;
      };

      function unique(value, index, self) { 
        return self.indexOf(value) === index;
      };

      function createPanelistList_full() {
        if ($event_panelists_full_formatted.includes("yellow") == true) {
          return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>";
        } else {
          if ($event_panelists_full_formatted !== undefined) {
          let listOpen = '<ul>'
            $event_panelists_full_formatted.forEach(panelist => {
              listOpen += '<li>'+ panelist + '</li>';
            });
            listOpen += '</ul>';
          return listOpen;
          } else return;
        }
      };

      function createPanelistList_title_company_only(panelist_list) {
        let arr = "";
        if (panelist_list.includes("yellow") == false) {
          if (panelist_list.length == 0) {
            return arr += panelist_list;
          } else if (panelist_list.length == 1) {
            return arr += panelist_list;
          } else panelist_list.forEach(panelist => {
              return arr += panelist + ", ";
          });
          return arr;
        } else return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>"
      };

      function parkingInstructions($event_parking){
         if (Array.isArray($event_parking) == false){
           return "";
         } else if ($event_parking[0] == "" || $event_parking[0].includes("N/A")) {
           return "";
         } else return customReplace($event_parking[0], "CLIENT NAME", $event_client);
      };

      function parkingInstructions_panel_prep_call_agenda($event_parking){
        if (Array.isArray($event_parking) == false){
          return "";
        } else if ($event_parking[0] == "" || $event_parking[0].includes("N/A")) {
          return "";
        } else return "<li>Parking: " + customReplace($event_parking[0], "CLIENT NAME", $event_client) + "</li>";
     };

      function parkingInstructions_event_prep_details($event_parking){
        if (Array.isArray($event_parking) == false){
          return "";
        } else if ($event_parking[0] == "" || $event_parking[0].includes("N/A")) {
          return "";
        } else return "<li>Parking: " + customReplace($event_parking[0], "CLIENT NAME", $event_client) + "</li>";
     };

     function parkingInstructionsCCscript($event_parking) {
      if (Array.isArray($event_parking) == false){
        return "";
      } else if ($event_parking[0] == "" || $event_parking[0].includes("N/A")) {
        return "";
      } else return "<b>*Parking Instructions</b><br>" + customReplace($event_parking[0], "CLIENT NAME", $event_client) + "<br><br>";
     }

     function contentSnippetAlternate() {
      if($event.hasOwnProperty("Content Snippet 2")) {
        return $event["Content Snippet 2"];
      } else return $event_snippet;
     }

      function eventSurvey(survey) {
        if ( survey !== undefined){
          return "this one-minute survey? <span style='background:yellow'>MISSING SURVEY</span><br><br>";
        } else return "this one-minute survey? " + $event_survey + "<br><br>";
     };

    function ifOnSiteRepisAccountManager(account_manager){
      if (account_manager == $event_onSite) {
        return "I will be on site tomorrow to ensure everything goes flawlessly. Here is my cell number if you want to connect:";
      } else return $event_onSite + " from our team will be on site tomorrow to set up and ensure everything goes flawlessly. Here is their cell number in case you want to connect:";
    };

     function onSiteDetails(person){
        if ( person == undefined || person == null){
          return "PHONE NUMBER";
        } else if ( person == "Steve Etzler") {
          return "(917) 576-0638 - Steve";
        } else if ( person == "Robyn Etzler") {
          return "(732) 266-8944 - Robyn";
        } else if ( person == "Hope Demel") {
          return "(224) 806-1280 - Hope";
        } else if ( person == "Stephanie Pereira Lima") {
          return "(305) 281-4475 - Stephanie";
        } else if ( person == "Melanie Chalupa") {
          return "(214) 686-0771 - Melanie";
        } else if ( person == "Mona Watkins") {
          return "(917) 855-1244 - Mona";
        } else if ( person == "Boryana Yordanova") {
          return "(718) 404-4259 - Boryana";
        }
      };

      function event_Format_Agenda(format){
        if ( format == undefined || format == null){
          return "This event record does have an event format";
        } else if ( format == "Roundtable") {
          return `<ul><li>11:30AM – Sponsor team arrives</li>
          <li>11:45AM – Panelists arrive</li>
          <li>12:00PM – Program begins with informal networking</li>
          <li>12:20PM – Attendees are directed to seats, servers take orders, informal networking continues (first course is served)</li>
          <li>12:35PM – BDI welcoming remarks, Sponsor welcoming remarks</li>
          <li>12:40PM – Begin with thought leadership panel (entrees and desserts will be served throughout the session)
          <li>01:30PM – Begin interactive open room discussion / Q&A with attendees</li>
          <li>01:45PM – Panel ends, speakers sit down at the roundtables, continue discussions at roundtables</li>
          <li>02:00PM – Program ends with optional continued networking</li>
          <li>02:15PM – Internal debrief to record sales notes and event feedback</li><br>
          
          <b>REGISTRATION LIST</b><br><br>
          Please see our table assignments {{ INSERT TABLE ASSIGNMENT VIEW }} so you know who you’ll be seated with.<br><br>`+
          "Please see the live registration list " + "<a href='" + $event_promo_reg_list + "'>here.</a><br>"

        } else if ( format == "Hollow Square") {
          return `<ul><li>11:30AM – Sponsor reps arrive</li>
          <li>11:45AM – Panelists arrive</li>
          <li>12:00PM – Program begins with informal networking</li>
          <li>12:15PM – Attendees are directed to seats, servers take orders, informal networking continues (first course is served)</li>
          <li>12:30PM – BDI welcoming remarks, Sponsor welcoming remarks</li>
          <li>12:35PM – Panelists introduce themselves, followed by attendees</li>
          <li>12:45PM – Thought leadership panel and interactive open room discussion (entrees and desserts will be served throughout the session)</li>
          <li>02:00PM – Program ends with optional continued networking</li>
          <li>02:15PM – Internal debrief to record sales notes and event feedback</li></ul>
          
          <b>REGISTRATION LIST</b><br><br>
          We will be seated around a large hollow rectangle table to optimize interactivity, and your team will be dispersed among the attendees.<br>
          Please see the live registration list ` + "<a href='" + $event_promo_reg_list + "'>here.</a><br>"
        } else return "Check event record on Airtable - value needs to be Roundtable or Hollow Square"
      };

      function panelPrepCallAgenda(format){
        if ( format == undefined || format == null){
          return "This event record does have an event format";
        } else if ( format == "Roundtable") {
          return `<ul><li>12:00 PM – 12:30 PM Reception, Meet & Greet</li>
          <li>12:30 PM – 12:40 PM Welcome Remarks and Lunch Begins</li>
          <li>12:40 PM – 1:45 PM Panel Discussion and Q&A with Attendees</li>
          <li>1:45 PM – 2:00 PM Interactive Roundtable Discussion</li></ul><br>`
        } else if ( format == "Hollow Square") {
          return `<ul><li>12:00 PM – 12:30 PM	Reception, Meet & Greet</li>
          <li>12:30 PM – 12:45 PM	Welcome Remarks and Lunch Begins</li>
          <li>12:45 PM – 2:00 PM	Panel Discussion and Open Room Discussion</li></ul><br>`
        } else return "Check event record on Airtable - value needs to be Roundtable or Hollow Square"
      }

      function isThisAnArray(value) {
        if (Array.isArray(value) == true) {
          var uniqueNames = [];
          $.each(value, function(i, el){
              if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
          });
          return uniqueNames;
        } else return "<span style='background:yellow'>MISSING COMPANIES</span>";
      };

      function getTodaysDate() {
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        Date.prototype.getDayName = function() {
          return days[ this.getDay() ];
        };
        let today = new Date();
        var todayName = today.getDayName();
        return todayName;
      }

      function days_plural() {
        if ($event_days_away == 1) {
          return "day";
        } else return "days"
      }

      function ifCanada() {
        if ($event_city == "Toronto" || $event_city == "Vancouver" || $event_city == "Calgary") {
          return "Uber Eats";
        } else return "Grubhub";
      };

      /*
      function date_prefix_calculator() {
        let today = new Date().getFullYear() + "-" + new Date().getMonth() + "-" + new Date().getMonth()
        if ($event_date_full_numeric == (new Date().getDate() + 1) ) {
          return "tomorrow"
        } else return " numeric " + $event_date_full_numeric + " today= " + new Date().getFullYear()
      }
      */

      function target_subject(target) {
        if (target == "Vertical") {
          return "Brunch";
        } else return "Lunch"
      }

      function target_local(target) {
        if (target == "City") {
          return " local ";
        } else return ""
      }

      function target_1_1_area(target) {
        if (target == "City") {
          return "the " + $event_city + " area";
        } else if (target == "Region") {
          return "the " + $event_target_region + " region";
        } else return "across the nation"
      }

      function target_lunch_or_brunch(target) {
        if (target == "Vertical") {
          return "brunch";
        } else return "lunch"
      }

      function target_2_1_area(target) {
        if (target == "City") {
          return "the " + $event_city + " area";
        } else if (target == "Region") {
          return "the " + $event_target_region + " region";
        } else return "across the country"
      }

      function target_panel_4_1(target) {
        if (target == "City") {
          "local to " + $event_city + " online."
        } else if (target == "Region") {
          "local to the " + $event_target_region + " region online."
        } else if (target == "Vertical") {
          return "online";
        }
      }

      const $pr_drafts = 
      [
        // PR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Based on your career experience and your role at {{COMPANY}}, I thought you might be a good fit to be a panel speaker for a virtual "+ target_lunch_or_brunch($event_target_copy) +" event I am organizing on " + $event_long_date + ".<br><br>" +

        "While we traditionally host our events in-person at award-winning restaurants around the country, we have transitioned to virtual events out of concern for the health and safety of our attendees and to do our part in flattening the curve during the current COVID-19 crisis.<br><br>"+

        "Our virtual event, " + $event_full_title + ", will gather " + $event_audience_and_size + " from " + target_1_1_area($event_target_copy) + " for video-networking in small breakout rooms before and after our interactive panel discussion. We’ll be sharing " + ifCanada() +" codes, so everyone can still enjoy lunch while they participate from the comfort and safety of their homes/offices.<br><br>" +

        "The panel discussion will be conversational, with no formal presentations or press. We ask a total time commitment of two hours from our panelists: 30 minutes for a panel practice run prior to the event, and attendance from 11:45 AM – 1:30 PM "+ $event_timezone +" the day of.<br><br>" +

        "May I confirm your interest and follow up with additional details?",

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +
        
        "Hey again {{FIRST_NAME}},<br><br>" +

        "Just wanted to circle back on my panel invitation below and expand on the topics we’ll cover.<br><br>" +

        "At a high level, we are looking to explore the discussion points below, though these conversations tend to flow in the direction of attendees’ interests and the passions of our panel—we can dive into your expertise and preference in greater detail on our panel practice run:<br><br>" +
        
        `<ul>
        <li>DISUCSSION TOPIC 1</li><br>
        <li>DISUCSSION TOPIC 2</li><br>
        <li>DISUCSSION TOPIC 3</li><br>
        <li>DISUCSSION TOPIC 4</li><br>
        </ul>` +

        "If these topics are of interest to you, but you are not interested in participating as a speaker, we would still love to have you join as an attendee.<br><br>" +

        "Would you like to contribute to our panel discussion?<br><br>" +

        "Cheers,<br>" +
        "Steve Etzler",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +

        "Hope your day is going well, {{FIRST_NAME}}. Just wanted to bring this invite to the top of your inbox.<br><br>" +

        "We would really love to have your contribution to our " + $event_short_title + " lunch if you’re available and the content appeals to you.<br><br>" +

        "We’ve had overwhelmingly positive feedback on our pivot to virtual events and past panelists have found their participation to be an excellent networking opportunity and a great chance to discuss topics of interest with other subject matter experts and industry professionals.<br><br>" +

        "You can see the full virtual event details here at our " + $event_website + "<br><br>" +

        "Happy to jump on a 5-minute call to further explain our objectives and to share more about the panel experience.<br><br>" +

        "May we count you in?<br><br>" +

        "Steve",

        // PR MESSAGE 1.4

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.4</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I know I’ve been persistent, but I think you would be a valuable addition to our panel discussion.<br><br>" +
        
        "The event should be a great opportunity for you to demonstrate your domain expertise as a <b>" + $event_audience + " leader</b>, and to share your knowledge.<br><br>" +
                
        "We’ll be providing "+ ifCanada() +" codes to cover the ‘lunch’ portion of the ‘lunch and learn’, and we expect to have a strong attendance of <b>" + $event_audience + "</b> local to " + target_panel_4_1($event_target_copy) +".<br><br>" +

        "Are you interested in speaking on the virtual panel on " + $event_long_date + "?<br><br>" +
        
        "Hope you have a great day,<br><br>" +

        "Steven Etzler",

      ];

      const $rr_drafts = 
      [
        // RR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Join Our Virtual Networking "+ target_subject($event_target_copy) +"!</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "You’re invited to participate in our exclusive virtual thought leadership event, "+ $event_full_title +", on "+ $event_long_date +" from 12 to 1:30pm "+ $event_timezone +" with a group of "+ target_local($event_target_copy) + $event_audience + " from " + target_1_1_area($event_target_copy) + ". In addition to listening to our panel of industry experts, you will be able to meet your fellow attendees in video breakout room sessions to further expand your network and discuss "+ $event_snippet +".<br><br>" +

        "While we traditionally host our events in-person at award-winning restaurants around the country, we have transitioned to virtual events out of concern for the health and safety of our attendees and to do our part in flattening the curve during the current COVID-19 crisis.<br><br>"+

        "We will be sending all attendees a $30 " + ifCanada() +" code so everyone can still enjoy the discussion and networking over a meal of their choice, from the comfort of their offices/homes. Alternatively, attendees can choose to donate their lunch to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.<br><br>" +

        "You can find our list of panelists and the specific topics we’ll be discussing on our event website, linked here."+ $event_website +"<br><br>" +

        "Are you interested in RSVPing, {{FIRST_NAME}}? Just respond here and we’ll take care of the rest!<br><br>"+
        
        " Cheers,<br>",

        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re: {{FIRST_NAME}}, Join Our Virtual Networking "+ target_subject($event_target_copy) +"!</p><br><br>" +
        
        "Hey {{FIRST_NAME}},<br><br>" +

        "Our pivot to virtual events has allowed us to continue providing our attendees with an exceptional learning and networking experience during the COVID-19 crisis. In the past weeks, we’ve successfully run quite a few virtual "+ target_lunch_or_brunch($event_target_copy) +" and learn events with engaging content panels and small video breakout room discussions among our attendees. Feedback has been overwhelmingly positive.<br><br>" +

        $event_full_title +" will revolve around a discussion of "+ contentSnippetAlternate() +". Our expert panel will feature "+ $event_panelists_full_formatted +".<br><br>" +

        "You can view the current list of participants you can expect to meet and network with here ("+ $event_promo_reg_list +").<br><br>" +
        
        "While we would have loved to meet you at one of our face-to-face events, we hope you can join us for our virtual event.<br><br>" +

        "May we count you in?<br><br>" +
        
        "Steve",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re: {{FIRST_NAME}}, Join Our Virtual Networking "+ target_subject($event_target_copy) +"!</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I hope this email finds you well. We still have registration space for our virtual networking event, "+ $event_full_title +", scheduled for "+ $event_long_date +" and would love to have you attend.<br><br>" + 

        "We’ll be sending a $30 "+ ifCanada() +" code to all registered attendees so everyone can enjoy our panel discussion and Q&A over "+ target_lunch_or_brunch($event_target_copy) +". Or, if you don’t want us to send you a code, we can donate to Meals 4 Heroes for you.<br><br>" +

        "With Coronavirus continuing to disrupt workplaces, events, and broader social interactions, we’re hoping our virtual events can provide an effective means of allowing professionals to continue expanding their "+ target_local($event_target_copy) +" network and sharing insights as leaders within their industries.<br><br>" +

        "Would you like to join us?<br><br>"+

        "Stay healthy,<br><br>" +
        
        "Steve",

        // RR MESSAGE 2.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> {{FIRST_NAME}}, Your Invitation to "+ $event_short_title +"</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I’d like to invite you to attend our virtual event on "+ $event_long_date +".<br><br>" + 

        "We’ll be hosting "+ $event_short_title +" over Zoom from 12 to 1:30pm " + $event_timezone + " and would love to have you join us.<br><br>" +

        "You'd be networking with an invite-only group of other "+ $event_audience +" from "+ target_2_1_area($event_target_copy) +", all engaged in thought-provoking discussions about "+ $event_snippet +".<br><br>" +

        "We’ll be sharing a $30 "+ ifCanada() +" code with all registered attendees so everyone can enjoy "+ target_lunch_or_brunch($event_target_copy) +" together, even if it’s only over webcams! Or, if you prefer, we can donate your meal to Meals 4 Heroes to help support healthcare workers and restaurants impacted by the coronavirus crisis.<br><br>"+

        "May I confirm your interest and follow up with additional details?<br><br>" +

        "Have a wonderful day" + /*getTodaysDate() gets the day of thr week*/ +",<br><br>",

        // RR MESSAGE 2.2


        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re:{{FIRST_NAME}}, Your Invitation to "+ $event_short_title +".</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +
        
        "Circling back on my invite below—I know with everything going on in the world it’s hard to think about plans on "+ $event_month_number +"/"+ $event_day_number +", but I'd love to have you join us if your calendar's open.<br><br>" +

        "We’ll have panelists from "+ sort_array_add_and(isThisAnArray($event_panelists_companies)) +" sharing their insights around "+ contentSnippetAlternate() +".<br><br>" +

        "If you’d like more information on our discussion topics, you can find it here ("+ $event_website +") on our event website.<br><br>" +

        "Can I send you the agenda for "+ $event_short_title +"?<br><br>" +

        "Cheers,<br><br>" +
        
        "Steve",

        // RR MESSAGE 2.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re:{{FIRST_NAME}}, Your Invitation to "+ $event_short_title +".</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I know I’ve already reached out, but since I haven’t heard back from you, I wanted to follow up as this will be a great opportunity for you to expand your professional network.<br><br>" +
        
        $event_full_title +" is shaping up to be an exciting event with an engaging group of "+ $event_audience +".<br><br>" +
        
        "While you might not be able to meet other attendees face-to-face, you will still be able to meet over video chat, engage in small group discussions in video breakout rooms, and take full advantage of peer-to-peer learning with our other guests.<br><br>" +
        
        "You can see who’s signed up so far here ("+ $event_promo_reg_list +").<br><br>" +
        
        "Would you like me to reserve a spot for you?<br><br>" +

        "Best,<br><br>" +
        
        "Steve",

        // RR MESSAGE 3.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 3.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Open Spots for Our Virtual Networking Event</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I’m sure you have a busy schedule, but I wanted to let you know that we still have a few spots remaining for our exclusive virtual "+ target_lunch_or_brunch($event_target_copy) +" and learn, "+ $event_short_title +", on "+ $event_long_date +". The event will run from 12:00 pm to 1:30 pm "+ $event_timezone +".<br><br>" +

        "If you’d like to join us, I’d be happy to save one of those spots for you. All attendees will receive a complimentary $30 "+ ifCanada() +" code, so they can enjoy having their favorite meal delivered while our panel leads an engaging and informative discussion. Alternatively, attendees have the option of having their meal donated to Meals 4 Heroes, to support healthcare workers and restaurants affected by the coronavirus pandemic.<br><br>" +

        "You can find more information about the panel and the specific topics at our event website. "+ $event_website +"<br><br>" +

        "We would also be happy to have any interested colleagues join you as your guests.<br><br>"+

        "May we count you in for "+ target_lunch_or_brunch($event_target_copy) +", {{FIRST_NAME}}?<br><br>" +

        "Best regards,",

        // RR MESSAGE 4.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 4.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Final Invite to Our Virtual Thought Leadership Event</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        $event_full_title + " is just around the corner!<br><br>" +

        "Spots for our virtual event are limited so we can preserve the intimate nature of the event and the high networking value for attendees, but we would still love to have you join us {{NEXT/THIS/TOMORROW}} "+ $event_long_date +" from 12:00 – 1:30pm"+ $event_timezone +".<br><br>" +

        "Check out who’s signed up so far here. " + $event_promo_reg_list + "<br><br>" +

        "If you can’t make it, we do many virtual events and would be happy to send relevant invites your way.<br><br>" +

        "Would you like me to RSVP you?<br><br>" +

        "Have a great day and hope to see you online next " + $event_weekday + ",",

        // RR MESSAGE - RESCHEDULE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment - Reschedule 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re: Coronavirus Update: "+ $event_short_title +" changed to a virtual event</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        "Due to the recent developments with the Coronavirus and our concern for the health and safety of our attendees, we are transitioning our live event, "+$event_short_title+", from an in-person thought leadership lunch to a virtual event hosted over Zoom.<br><br>" +

        "Our original panel of speakers will still discuss "+$event_snippet+". All attendees will be encouraged to actively engage in the discussion through video chat, simulating the interactive and intimate nature of our original in-person event.<br><br>" +

        "To preserve the networking value of the lunch, attendees will be able to join small group discussions in breakout room sessions and meet other marketing leaders local to the "+ $event_city +" area.<br><br>" +

        "And while we will no longer be hosting the event at "+ $event_venue +", we will be sending all attendees a $30 "+ ifCanada() +" code so everyone can still enjoy the discussion and networking over a lunch of their choice, from the comfort of their offices/homes..<br><br>" +

        "The virtual event will run tomorrow, " + $event_long_date +" from 12 pm to 1:30 pm. Full event details are available here at our event website " + $event_website + ").<br><br>" +

        "{{FIRST_NAME}}, would you like to join us?<br><br>"+

        "Best regards,",

      ];

      const $rc_drafts = 
      [
        // NO SHOW MESSAGE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Cancellations/No-Shows</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Sorry we missed you!</p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Sorry we missed you at yesterday's " + $event_short_title + " virtual meeting!<br><br>" +

        "Special thanks to "+ $event_client +" for making the event possible, and the following panelists for leading an exceptional discussion:<br>" +
        
        createPanelistList_full() +

        "We had an insightful conversation on " + $event_snippet + " with great participation from our attendees.<br><br>" +

        "We understand things come up and we’d still love to have you participate in future events! We do events in " + $event_city + " fairly often to discuss these and other topics.<br><br>" +

        "Are you open to keeping in touch?<br><br>" +

        "Thank you,<br><br>" +

        "<b>The Teams at BDI & " + $event_client + "</b>",

        // THANK YOU MESSAGE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Thank You for Attending</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Thanks for attending!</p><br><br>" +
        
        "Hi FIRST NAME,<br><br>" +

        "Thank you so much for attending the " + $event_short_title + " virtual meeting last " + $event_long_date +"!<br><br>" +

        "Special thanks to " + $event_client + " for making the event possible, and the following panelists for leading an exceptional discussion:<br>"+

        createPanelistList_full() +

        "We'd love to hear your thoughts on your experience. Would you mind answering " + eventSurvey($event_survey) +

        "If you’re interested in continuing your conversation with " + $event_client + ", please contact <span style='background-color:yellow;text-transform:uppercase;'>CONTACT @ EMAIL.</span><br><br>" +

        "Want to hear more about " + $event_short_title + " and check out some great webinar selections? " + highlight_This("Click here to learn more") + "<br><br>" +

        "Thank you. We hope to see you at a future event!<br><br>" +

        "<b>The Teams at BDI & " + $event_client + "</b>",

        // RSVP YES - CONFIRMED

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - RSVP YES - Confirmed</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <i>RE: Thread</i></p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Thank you for your response! Delighted to have you join!<br><br>" +

        "To join the meeting, please click here: "+ highlight_This("INSERT ZOOM LINK from VA Team View") +"<br><br>" +

        "Please download the Zoom software in order to participate in the video-based breakout room networking sessions before and after the panel. Download here: https://zoom.us/download<br><br>"+

        "Please be prepared to have your video and microphone on.<br><br>" + 

        `Here is the agenda for the session:<br>
        <ul>
        <li style="list-style: none;"><b>12:00PM Attendees Enter Virtual Event & Welcome Remarks</b></li>
        <li style="list-style: none;"><b>12:05PM Video Networking in Breakout Rooms</b></li>
        <li style="list-style: none;"><b>12:15PM Panel Discussion</b></li>
        <li style="list-style: none;"><b>12:55PM Audience Q&A</b></li>
        <li style="list-style: none;"><b>1:10PM Breakout Networking Sessions</b></li>
        <li style="list-style: none;"><b>01:30PM Event Ends</b></li>
        </ul><br>`
        +

        "We will provide you with the "+ ifCanada() +" code on the day of the event—stay tuned for that. Or please let us know if you’d prefer to have your meal donated to Meals 4 Heroes.<br><br>" +

        "Please make sure to whitelist our email address to ensure the code isn't sent to spam. Look forward to your participation!<br><br>" +

        `Steve`,

        // RSVP YES - TENTATIVE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - RSVP YES - Tentative/Interested</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <i>RE: Thread</i></p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Thanks for your response & interest in our event!<br><br>" +
        
        "We will put you down as a tentative registrant for now, and will send you a calendar invite as a placeholder. To learn more about the discussion topics and our panel, check out the event website: " + $event_website +"<br><br>" +
                        
        "You can also view who we have confirmed so far on this link." + $event_promo_reg_list +"<br><br>" + 

        `Here is the agenda for the session:<br>
        <li style="list-style: none;"><b>12:00PM Attendees Enter Virtual Event & Welcome Remarks</b></li>
        <li style="list-style: none;"><b>12:05PM Video Networking in Breakout Rooms</b></li>
        <li style="list-style: none;"><b>12:15PM Panel Discussion</b></li>
        <li style="list-style: none;"><b>12:55PM Audience Q&A</b></li>
        <li style="list-style: none;"><b>1:10PM Breakout Networking Sessions</b></li>
        <li style="list-style: none;"><b>01:30PM Event Ends</b></li>`
        +

        "Look forward to your participation!<br><br>" +

        `Steve`,

        // FINAL CONFIRMATIONS / PER MY VOICEMAIL

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Final Confirmation </p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Please Confirm: Tomorrow's "+ $event_short_title +" Virtual Meeting</p><br><br>" +

        "Hi FIRSTNAME,<br><br>" +

         highlight_This("VALUE") + " " + $event_short_title + " video-based virtual meeting, taking place from 12 to 1:30PM on Zoom.<br><br>" + 

        "To join the meeting, <span style='color:red;'>click here. </span>"+ $event_virtual_link +"<br><br>"+

        "Please download the Zoom software in order to participate in the video-based breakout room networking sessions before and after the panel. Download here: https://zoom.us/download.<br><br>" +

        "Please be prepared to have your <b>video and microphone on</b>.<br><br>"+

        "<span style='color:red;'>Please reply back to confirm your participation</span> so we can send you a "+ ifCanada() +" code for lunch! Or please let us know if you’d prefer to have your meal donated to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.<br><br>"+

        `Here is the agenda for the session:<br>
        <ul>
        <li>12:00PM Attendees Enter Virtual Event & Welcome Remarks</li>
        <li>12:05PM Video Networking in Breakout Rooms</li>
        <li>12:15PM Panel Discussion</li>
        <li>12:55PM Audience Q&A</li>
        <li>1:10PM Breakout Networking Sessions</li>
        </ul><br>

        Thank you and we look forward to seeing you tomorrow!<br><br>

        Best regards,<br>
        Steve Etzler, CEO<br>
        <b>Business Development Institute</b>`,

         // SEE YOU TODAY

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - See you today</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you today at our virtual event!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "We look forward to seeing you today at "+ highlight_This("TIME") +" at our virtual lunch & learn—" + $event_full_title +"!<br><br>" +

         "<span style='color:red;'><b>Here is your " + ifCanada() + " eGift card NUMBER and your PIN PINNUMBER so you may enjoy lunch, courtesy of <span style='color:red;'>"+ $event_client +"</span>! </b></span><br><br>"+

         "Please let us know if you’d prefer to have your meal donated to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.<br><br>" +

         "To join, please click here: " + $event_virtual_link +"<br><br>"+
         
         "The objective is to provide a virtual, video-based networking experience in addition to valuable content. Please expect to network with other participants BEFORE and AFTER the panel in breakout rooms. If you haven’t already, please download the Zoom software in order to participate in the breakout room sessions. Download here: https://zoom.us/download<br><br>" +

         "Please be prepared to have your video and microphone on.<br><br>" +
         
         `Thank you,<br>`,

        // SCHEDULING PANEL PREP CALL

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Scheduling Panel Prep Call</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Schedule Panel Practice Run | "+ $event_short_title +"</p><br><br>" +

        "Hello all,<br><br>" +

        "We’re excited for your panel participation at " + $event_short_title + "virtual meeting, taking place on "+ $event_long_date +" from 11:45AM – 1:30PM at on our video-based platform Zoom.<br><br>" +

        "We would like to schedule a 30 minute panel practice run on "+ highlight_This("DAY, DATE") +" between "+ highlight_This("TIME") +".<br><br>"+

        "As soon as I hear back from everyone, I’ll respond with a calendar invite for the time that works best across the board.<br><br>"+

        "Thank you!<br>"+
        isBlank($event_account_manager),

        // PANEL PREP CALL AGENDA

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Prep Call Agenda</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>" + $event_short_title + " Panel Prep</p><br><br>" +
 
        "Hello all,<br><br>"+

        "Looking forward to our panel practice run on "+ highlight_This("DAY, DATE at TIME")+". To join the video meeting, please click here: "+ highlight_This("AM ZOOM")+".<br><br>" +

        "Kindly see the agenda and event details below.<br><br>" +

        "Thank you,<br>" +
        isBlank($event_account_manager) + "<br><br>" +

        "<b>INTRODUCTIONS</b><br><br>" +
        "<i>Panelists:</i>" +
        createPanelistList_full() +
        "<br>" +

        "<i>Moderator</i>:<br>" +
        "<ul><li>"+$event_moderator_full_formatted+"</li></ul><br>"+

        "<b>EVENT DETAILS</b><ul>"+
        "<li>Program: "+ $event_full_title +"</li>"+
        "<li>Date: " + $event_long_date +"</li>"+
        "<li>Time: Video-based virtual meeting from 12pm - 1:30pm </li>"+
        "<li>Location: " + "<a href='" + $event_virtual_link + "'>LINK</a></li>" +
        "<li>Event Website: " + "<a href='" + $event_website + "'>LINK</a></li>" +
        "<li>Registration List: " + "<a href='" + $event_promo_reg_list + "'>LINK</a></li></ul><br>" +

        "<b>AGENDA</b>"+
        "<li>11:45AM Panelists & Moderator join </li>"+
        "<li>12:00PM Attendees Enter Virtual Event & Welcome Remarks</li>"+
        "<li>12:05PM Video Networking in Breakout Rooms </li>"+
        "<li>12:15PM Panel Discussion</li>" +
        "<li>12:55PM Audience Q&A<br>" +
        "<li>1:10PM Breakout Networking Sessions</li></ul><br><br>" +

        "<b>LOGIN DETAILS</b>" +
        "<p>Please download the Zoom software in order to participate in the video-based breakout room networking sessions before and after the panel. Download here: https://zoom.us/download.<br>"+
        "<p>Please be prepared to have your video and microphone on.</p><br>"+

        "<b>LUNCH</b><br>" +
        "<p>We will provide a $30 code for "+ ifCanada() +" so you may enjoy lunch on the morning of the event - stay tuned for that! Or let us know if you’d prefer to have your meal donated to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.</p><br>"+

        "<b>PANEL DISCUSSION QUESTIONS</b><br>" +
        "<p>"+ highlight_This("Insert bullet points from website OR panel questions provided by moderator") + "</p><br><br>",

        // ONE WEEK REMNINDER

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> One Week Reminder (Confirmed)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you (on your webcam) next "+ $event_weekday +"!</p><br><br>" +

        "Hi NAME,<br><br>"+

        "We hope you’re excited about next week’s "+ $event_full_title +" virtual lunch & learn!<br><br>"+

        "With our panel of experts, we’ve prepared a dynamic and informative list of topics for our discussion. You’ll be able to listen and share your thoughts with our impressive list of registrants below and participate in video-based networking breakout sessions.<br><br>"+

        "Here is the link to join the meeting: "+ $event_virtual_link +"<br><br>"+

        "Please download the Zoom software in order to participate in the breakout room networking sessions before and after the panel: https://zoom.us/download<br><br>"+

        "Please be prepared to have your video and microphone on.<br><br>"+

        "<b>This email serves as a reminder and an invite for you to share with a colleague who may also find this event valuable.</b><br><br>"+

        "Thanks, we look forward to seeing you online from 12 to 1:30 pm on "+ $event_long_date +".<br><br>"+

        "Best regards,<br>" +
        "<b>Steve Etzler</b>"+
        "<b>Business Development Institute</b><br><br>"+
        
        "REGISTRATION LIST<br>"+
        "{{{COPY AND PASTE REG LIST HERE}}}",

        // RSVP NO - Virtual

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> RSVP NO - Response</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i>  We’ve Gone Virtual!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "You let me know a while back that you wouldn’t be able to join us at "+ $event_venue +" in " + $event_city +" for "+ $event_full_title + " on "+ $event_long_date +". At this time, due to current Coronavirus concerns, we’ve decided to take the entire event virtual!<br><br>"+
 
         "Instead of going from 12 – 2pm at the restaurant, we’ll go from 12 – 1:30pm online—the agenda will still include an interactive panel discussion, breakout session networking with your local peers, and we’ll be sending "+ ifCanada() +" codes to all the attendees—so lunch is still on us!<br><br>"+
 
         "Please check out the event website "+ $event_website +" and let me know if you’re able to join us—we’d love to have you, and I’m happy to save you a spot.<br><br>"+
 
         "Hope you’re staying healthy,<br><br>"+
  
         "Steve Etzler<br>" +
         "<b>Business Development Institute</b>",

        // CONFIRMATION CALLS SCRIPT

        "<p class='messagetypename'><i class='fa fa-phone'></i> Confirmation Calls Script</p><br>" +

        "Hi <span style='color:red;'>{NAME}</span>,<br><br>"+

        "This is <span style='color:red;'>{VA}</span> calling from BDI.<br><br>"+

        "We have you registered to join our virtual lunch & learn "+ $event_full_title +" tomorrow, "+ $event_long_date + " from 12-1:30PM. If your schedule has changed and you can no longer attend, please let us know by responding to Steve's email.<br><br>"+

        "Thank you! Bye!<br><br>",

      ];

      const $cc_drafts = 
      [
        // EVENT PREP DETAILS

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Event Prep Details - Client Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>  Event Prep for Virtual "+ $event_short_title + " | "+$event_target_copy+"</p><br><br>" +

        "Hello all,<br><br>" +
        "We are excited for our virtual "+ $event_short_title +" event, taking place tomorrow, "+ $event_long_date +". See below for additional details.<br><br>" +
        "Thanks,<br><br>" +

        isBlank($event_account_manager) + "<br>" +

        "<b>EVENT DETAILS</b>" +
        `<ul>
        <li>Program: `+ $event_full_title +`</li>
        <li>Date: `+ $event_long_date +`</li>
        <li>Time: Video-based virtual meeting from 12pm -30pm`+ $event_timezone +`</li>
        <li>Location: `+ $event_virtual_link +`</li>
        <li>Website: `+ $event_website +`</li>
        <li>Registration List: `+ $event_promo_reg_list +`</li>
        <li>Sales Prep Guide - <i>see attached</i></li>
        </ul><br>`+

        "<b>PANELISTS</b>" +
        createPanelistList_full() + "<br>" +

        "<b>MODERATOR</b>" +
        "<ul><li>"+$event_moderator_full_formatted+"</li></ul><br>"+

        "<b>VIRTUAL EVENT FLOW</b>" +
        `<ul>
        <li>Sales reps will act as breakout room moderator</li>
        <li>We can work on giving each sales rep their own breakout room</li>
        <li>We can receive breakout room assignments to group them with a specific sales rep</li>
        <li style="list-style: none;"><b>12:00PM Attendees Enter Virtual Event & Welcome Remarks</b></li>
        <li style="list-style: none;"><b>12:05PM Video Networking in Breakout Rooms</b></li>
        <li>Breakout 1: Sales reps asking each person to introduce themselves and share what they are looking to get out of the event</li>
        <li style="list-style: none;"><b>12:15PM Panel Discussion</b></li>
        <li style="list-style: none;"><b>12:55PM Audience Q&A</b></li>
        <li style="list-style: none;"><b>1:10PM Breakout Networking Sessions</b></li>
        <li>Breakout 2: Sales reps can ask open ended questions to get the conversation flowing</li>
        <li style="list-style: none;"><b>01:30PM Event Ends</b></li>
        </ul><br><br>`,

        // CLIENT PANEL RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Panel Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>{{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Based on your career experience and your role at {{COMPANY}}, I thought you might be a good fit to be a panel speaker for a lunch event I am organizing on " + $event_date_month_and_number + ".<br><br>" +

        "While we traditionally host our events in-person at award-winning restaurants around the country, we have transitioned to virtual events out of concern for the health and safety of our attendees and to do our part in flattening the curve during the current COVID-19 crisis.<br><br>" +

        "Our virtual event, "+ $event_full_title +", will gather "+ $event_audience_and_size +" from "+ target_2_1_area($event_target_copy) + " for video-networking in small breakout rooms before and after our interactive panel discussion. We’ll be sharing "+ ifCanada() +" eGift cards with all attendees, so everyone can still enjoy lunch while they participate from the comfort and safety of their homes/offices. Or let us know if you’d prefer to have your meal donated to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.<br><br>" +

        "The panel discussion will be conversational, with no formal presentations or press. We ask a total time commitment of two hours from our panelists: 30 minutes for a panel practice run prior to the event, and attendance from 11:45 AM – 1:30 PM "+ $event_timezone +" the day of.<br><br>" +

        "You can see the full virtual event details here at our event website. "+ $event_website +"<br><br>"+

        "At a high level, we are looking to explore these discussion points:<br>" +

        `<ul>
        <li>DISUCSSION TOPIC 1</li>
        <li>DISUCSSION TOPIC 2</li>
        <li>DISUCSSION TOPIC 3</li>
        </ul>` +

        "May I confirm your interest and follow up with additional details?<br><br>" +

        "Stay healthy,<br><br>",

        // CLIENT REGISTRANT RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>Join Us For Lunch? </p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "You’re invited to participate in our exclusive virtual thought leadership event, "+ $event_full_title +", on "+ $event_long_date +" from 12 to 1:30pm "+ $event_timezone +" with a group of local "+ $event_audience +" from "+ target_2_1_area($event_target_copy) +". In addition to listening to our panel of industry experts, you will be able to meet your fellow attendees in video breakout room sessions to further expand your network and discuss the event topics.<br><br>" +
        
        "While we traditionally host our events in-person at award-winning restaurants around the country, we have transitioned to virtual events out of concern for the health and safety of our attendees and to do our part in flattening the curve during the current COVID-19 crisis.<br><br>" +
        
        "Our panel of speakers will discuss "+ $event_snippet +". All attendees will be encouraged to actively engage in the discussion through video chat, simulating the interactive and intimate nature of our original face-to-face event scheduled for the same day.<br><br>" + 
        
        "We will be sending a $30 food delivery code so everyone can still enjoy the discussion and networking over a lunch of their choice while supporting local restaurants. Or let us know if you’d prefer to have your meal donated to Meals 4 Heroes to support restaurants and healthcare workers in New York City impacted by the COVID-19 crisis.<br><br>" +
        
        "You can find our panelists and the specific topics we’ll be discussing on our event website, linked here. "+ $event_website +"<br><br>" +
        
        "Are you interested in RSVPing? Just respond here (<a href='mailto:steven.etzler@bdionline.com?subject=RSVP for the "+ $event_month_number +"/"+ $event_day_number + " " + $event_short_title + " " +" Virtual Lunch Event'>steven.etzler@bdionline.com</a>) and we’ll take care of the rest!<br><br>"+
        
        "Best regards,<br><br>"+
        "Steve Etzler",
    
      ];

      const $sc_drafts = 
      [
        // BDI COMES TO 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> BDI Comes To - Sales Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>  BDI Comes To 1.1 | BDI Comes To "+$event_city+"</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I will be in " + $event_city + " on " + $event_month + " " + $event_day_number + addDateSuffix($event_day_number) + " to run an event (event website " + highlight_This($event_website) + " " + highlight_This($event_promo_reg_list) + ") on the . I noticed you’re based in the area, so I thought it would be worthwhile to see if you’d like to meet while I am in town.<br><br>" +
        
        "BDI is an account-based event marketing agency focused on generating revenue for our clients through our prospect roadshows, called Accelerate.<br><br>" +
        
        "We partner with B2B tech companies as an extension of their marketing team to develop a turnkey Accelerate program that positions our clients as thought leaders in their space, while attracting qualified buyers from their target accounts to attend.<br><br>" +
        
        "Also sharing our case study with Equinix here " + highlight_This("https://www.bdionline.com/event/060917abm/") + ", which reviews the $1.5M ROI from our Accelerate event program with them.<br><br>" +
        
        "I’d be happy to meet over coffee or come into your office, if you’d like to chat further. Do you have availability on " + $event_month + " " + ($event_day_number - 1) + addDateSuffix(($event_day_number - 1)) + " to meet?<br><br>" +
        
        "Thanks,<br><br>",

        // BDI COMES TO 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> BDI Comes To - Sales Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>  BDI Comes To 1.2 | RE: BDI Comes To "+$event_city+"</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Kindly following up on my note below.<br><br>" +
        
        "To expand on what I’ve shared, our Accelerate events are thought-leadership driven prospect roadshows.<br><br>" +
        
        "Here is a short video " + highlight_This("https://www.bdionline.com/portfolio/acceleratevid/") + " to show you what an Accelerate event looks like. " + highlight_This("{{COMPANY}}") + " would be the sponsor. We are the organizers. The attendees would be from " +  highlight_This("{{COMPANY}}") + "'s top targets.<br><br>" +
        
        "Would you be open to meeting while I am in town on " + $event_month + " " + ($event_day_number - 1) + addDateSuffix(($event_day_number - 1)) + "?<br><br>" +
        
        "Thanks, and look forward to hearing from you!<br><br>" +
        $event_onSite,

        // BDI COMES TO 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> BDI Comes To - Sales Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>  BDI Comes To 1.3 | Meet next " + $weekday_before + "</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Would you like to meet next " + $weekday_before + ", " + $event_month + " " + ($event_day_number - 1) + addDateSuffix(($event_day_number - 1)) + " while I am in " + $event_city + "?<br><br>" +

        "I think there is a good fit for BDI to produce Accelerate events for " +  highlight_This("{{COMPANY}}") + " that attract buyers from your target accounts.<br><br>" +

        "Happy to arrange a phone call for a different day, if you’re interested in connecting but not available next " + $weekday_before + ". Please let me know.<br><br>" +

        "Best regards,<br><br>" +
        $event_onSite,

      ]

      const doubleSpaceAndLine = "<br><br><br>" + "<hr>" + "<br><br><br>";
  
      function generateCustomMessage() {
        if ($selectedMessageType == "Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            return $drafts.html($pr_drafts[0]);
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($pr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return $drafts.html($pr_drafts[2]);
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($pr_drafts[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            return $drafts.html($pr_drafts[0] + doubleSpaceAndLine + $pr_drafts[1] + doubleSpaceAndLine + $pr_drafts[2] + doubleSpaceAndLine + $pr_drafts[3] + "<br><br>");
          }
        } else if ($selectedMessageType == "Registrant Recruitment") {
          if ($selectedMessageName == "Reschedule 1.1") {
            return $drafts.html($rr_drafts[8]);
          } if ($selectedMessageName == "1.1"){
            return $drafts.html($rr_drafts[0]);
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($rr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return $drafts.html($rr_drafts[2]);
          } else if ($selectedMessageName == "2.1") {
            return $drafts.html($rr_drafts[3]);
          } if ($selectedMessageName == "2.2") {
            return $drafts.html($rr_drafts[4]);
          } else if ($selectedMessageName == "2.3") {
            return $drafts.html($rr_drafts[5]);
          } if ($selectedMessageName == "3.1") {
            return $drafts.html($rr_drafts[6]);
          } else if ($selectedMessageName == "4.1") {
            return $drafts.html($rr_drafts[7]);
          } else if ($selectedMessageName == "Full Sequence") {
            return $drafts.html($rr_drafts[0] + doubleSpaceAndLine + $rr_drafts[1] + doubleSpaceAndLine + $rr_drafts[2] + doubleSpaceAndLine + $rr_drafts[3] + doubleSpaceAndLine + $rr_drafts[4] + doubleSpaceAndLine + $rr_drafts[5] + doubleSpaceAndLine + $rr_drafts[6] + doubleSpaceAndLine + $rr_drafts[7] + "<br><br>");
          }
        } else if ($selectedMessageType == "Client Communication") {
          if ($selectedMessageName == "Event Prep Details"){
            return $drafts.html($cc_drafts[0]);
          } if ($selectedMessageName == "Client Panel Recruitment"){
            return $drafts.html($cc_drafts[1]);
          } if ($selectedMessageName == "Client Registrant Recruitment"){
            return $drafts.html($cc_drafts[2]);
          }
        } else if ($selectedMessageType == "Sales Communication") {
          if ($selectedMessageName == "BDI Comes To"){
            return $drafts.html($sc_drafts[0] + doubleSpaceAndLine + $sc_drafts[1] + doubleSpaceAndLine + $sc_drafts[2] + "<br><br>");
          }
        } else if ($selectedMessageType == "Registrant Communication") {
            if ($selectedMessageName == "Sorry We Missed You"){
              return $drafts.html($rc_drafts[0]);
            } else if ($selectedMessageName == "Thank You for Attending") {
              return $drafts.html($rc_drafts[1]);
            } if ($selectedMessageName == "RSVP YES - Confirmed") {
              return $drafts.html($rc_drafts[2]);
            } else if ($selectedMessageName == "RSVP YES - Tentative") {
              return $drafts.html($rc_drafts[3]);
            } if ($selectedMessageName == "Final Confirmation") {
              return $drafts.html($rc_drafts[4]);
            } if ($selectedMessageName == "See You Today") {
              return $drafts.html($rc_drafts[5]);
            } if ($selectedMessageName == "Scheduling Panel Prep Call") {
              return $drafts.html($rc_drafts[6]);
            } if ($selectedMessageName == "Panel Prep Call Agenda") {
              return $drafts.html($rc_drafts[7]);
            } if ($selectedMessageName == "One Week Reminder") {
              return $drafts.html($rc_drafts[8]);
            } if ($selectedMessageName == "Invite for RSVP NO Responses") {
              return $drafts.html($rc_drafts[9]);
            } if ($selectedMessageName == "Confirmation Calls Script") {
              return $drafts.html($rc_drafts[10]);
            }
          } else return $drafts.html("This message does not exist.");
      };

      function generateAutomaticMessage() {
        $("#predrafted-preview").append(predraftedHTML);
        predraftedHTML.html("");

        if ($selectedMessageType == "Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            return predraftedHTML.html($pr_drafts[0] + doubleSpaceAndLine + $pr_drafts[1] + doubleSpaceAndLine + $pr_drafts[2] + doubleSpaceAndLine + $pr_drafts[3] + "<br><br>");
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($pr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return predraftedHTML.html($pr_drafts[2]);
          } else if ($selectedMessageName == "1.4") {
            return predraftedHTML.html($pr_drafts[3]);
          }
        } else if ($selectedMessageType == "Registrant Recruitment") {
          if ($selectedMessageName == "1.1"){
            return predraftedHTML.html($rr_drafts[0] + doubleSpaceAndLine + $rr_drafts[1] + doubleSpaceAndLine + $rr_drafts[2] + doubleSpaceAndLine + $rr_drafts[3] + doubleSpaceAndLine + $rr_drafts[4] + doubleSpaceAndLine + $rr_drafts[5] + doubleSpaceAndLine + $rr_drafts[6] + doubleSpaceAndLine + $rr_drafts[7] + "<br><br>");
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($rr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return predraftedHTML.html($rr_drafts[2]);
          } else if ($selectedMessageName == "2.1") {
            return predraftedHTML.html($rr_drafts[3]);
          } if ($selectedMessageName == "2.2") {
            return predraftedHTML.html($rr_drafts[4]);
          } else if ($selectedMessageName == "2.3") {
            return predraftedHTML.html($rr_drafts[5]);
          } if ($selectedMessageName == "3.1") {
            return predraftedHTML.html($rr_drafts[6]);
          } else if ($selectedMessageName == "4.1") {
            return predraftedHTML.html($rr_drafts[7]);
          }
        }
          else if ($selectedMessageType == "Registrant Communication") {
            if ($selectedMessageName == "Sorry We Missed You"){
              return predraftedHTML.html($rc_drafts[0]);
            } else if ($selectedMessageName == "Thank You for Attending") {
              return predraftedHTML.html($rc_drafts[1]);
            } if ($selectedMessageName == "RSVP YES - Confirmed") {
              return predraftedHTML.html($rc_drafts[2]);
            } else if ($selectedMessageName == "RSVP YES - Tentative") {
              return predraftedHTML.html($rc_drafts[3]);
            } if ($selectedMessageName == "Final Confirmation") {
              return predraftedHTML.html($rc_drafts[4]);
            } if ($selectedMessageName == "See You Today") {
               return predraftedHTML.html($rc_drafts[5]);
            } if ($selectedMessageName == "One Week Reminder") {
              return predraftedHTML.html($rc_drafts[8]);
           }
      } else return predraftedHTML.html("This message does not exist.");
      };
      generateCustomMessage();
      generateAutomaticMessage();
    };
eventSelected();

$("#back-button").click(function(){
  location.reload();
});
