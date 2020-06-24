/* ------------------

BDI's Content Engine - A front end web application for automating email marketing campaigns, registrant, sales, and client communication drafting.

Author: Luke Greaves
Github: @lukegreaves5
Tools & libraries used: HTML, CSS, SCSS, JavaScript, jQuery, Airtable API, Underscore.js

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
      $event_content_3 = objectCheck(['Content Snippet 3']),
      $event_promo_reg_list = objectCheck(['PromoRegList']),
      $event_client_rsvp_list = objectCheck(['Client RSVP List']),
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
      $event_timezone = objectCheck(['Timezone']),
      $event_theme = objectCheck(['Content Theme']),
      $event_goal = objectCheck(['Content Goal']),
      $event_zoom_link = objectCheck(['Zoom Link']);

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

      function ifCanada(money) {
        if ($event_city == "Toronto" || $event_city == "Vancouver" || $event_city == "Calgary" || $event_city == "Canada") {
          if (money === 'money') {
            return "$25 Uber Eats";
          } else return "Uber Eats";
        } else if (money === 'money' && ($event_city !== "Toronto" || $event_city !== "Vancouver" || $event_city !== "Calgary" || $event_city !== "Canada")) {
            return "$30 Grubhub";
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

      function thisWeek_nextWeek_Tomorrow() {
        if ($event_days_away === 1) {
          return "Tomorrow's"
        } else if ($event_days_away < 7) {
          return "This Week's"
        } else if ($event_days_away > 7 && $event_days_away < 14) {
          return "Next Week's"
        } else return highlight_This("{{ This Week's / Next Week's / Tomorrow's }}")
      }

      function thisWeek_nextWeek_Tomorrow_inCopy() {
        if ($event_days_away === 1) {
          return "tomorrow"
        } else if ($event_days_away < 7) {
          return "this " + $event_long_date
        } else if ($event_days_away > 7 && $event_days_away < 14) {
          return "next " + $event_long_date
        } else return highlight_This("{{ This Week's / Next Week's / Tomorrow's }}") + " " + $event_long_date
      }

      function contentSnippetThree() {
        if ($event_content_3.includes("yellow") == true) {
          return $event_content_3
        } else return $event_snippet
      }

      const $pr_drafts = 
      [
        // PR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Are You a " + $event_theme + " Thought Leader? </p><br><br>" + //target_subject($event_target_copy)

        "Hi {{FIRST_NAME}},<br><br>" +

        "Based on your career experience and your role at {{COMPANY}}, I thought you might be a good fit to be a <b><u>panelist</u></b> for a virtual "+ target_lunch_or_brunch($event_target_copy) +" event I am organizing on " + $event_long_date + ".<br><br>" +

        $event_full_title + " will gather " + $event_audience_and_size + " from " + target_1_1_area($event_target_copy) + " for video-networking in small breakout rooms before and after an interactive panel discussion. It’ll be conversational, with no formal presentations or press.<br><br>"+

        "We ask a total time commitment of two hours and 15min from our panelists: 30 minutes for a panel practice run prior to the event, and attendance from 11:45am – 1:30pm " + $event_timezone + " the day of.<br><br>"+

        "May I confirm your interest and follow up with additional details?<br><br>" +

        "Cheers",

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> {{FIRST_NAME}}, Our Panel Needs Your Expertise</p><br><br>" +
        
        "Hey again {{FIRST_NAME}},<br><br>" +

        "Just wanted to circle back on my panel invitation below and expand on the topics we’ll cover.<br><br>" +

        "At a high level, we are looking to explore the discussion points below, though these conversations tend to flow in the direction of attendees’ interests and the passions of our panel—we can dive into your expertise and preference in greater detail on our panel practice run: <br><br>" +
        
        `<ul>
        <li>DISUCSSION TOPIC 1</li><br>
        <li>DISUCSSION TOPIC 2</li><br>
        <li>DISUCSSION TOPIC 3</li><br>
        <li>DISUCSSION TOPIC 4</li><br>
        </ul>` +

        "If these topics are of interest to you, but you are not interested in participating as a speaker, we would still love to have you join as an attendee.<br><br>" +

        "Would you like to contribute to our panel discussion?<br><br>" +

        "Best,<br>" +
        "Steve Etzler",

        // PR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Share What You Know at " + $event_short_title + "</p><br><br>" +

        "Hope your day is going well, {{FIRST_NAME}}. Just wanted to bring this invite to the top of your inbox.<br><br>" +

        "We would love to have you participate in " + $event_short_title + " if you’re available and the content appeals to you.<br><br>" +

        "We traditionally host these events at award-winning restaurants, so to keep the ‘"+ target_lunch_or_brunch($event_target_copy) + " and learn’ structure, we’re sending " + ifCanada('no') + " codes so each participant can enjoy a nice meal, with the option to donate it to healthcare workers if you prefer.<br><br>" +

        "We’ve received overwhelmingly positive feedback on our pivot from live to virtual events, and panelists are finding their participation to be an excellent networking opportunity as well as a chance to discuss topics of interest with other subject matter experts and industry professionals they might not otherwise rub shoulders with.<br><br>" +

        "You can see the full virtual event details here at our event website " + $event_website + "<br><br>" +

        "Happy to jump on a 5-minute call to further explain our objectives and to share more about the panel experience.<br><br>" +

        "May we count you in?<br><br>" +

        "Steve",

        // PR MESSAGE 1.4

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.4</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> This will have your LinkedIn Circles Talking!</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I know I’ve been persistent, but it’s because I think you’d be such a valuable addition to our panel discussion.<br><br>" +
        
        "The event should be a great opportunity for you to demonstrate your expertise as a " + $event_audience + " leader, and to share your experience with industry peers.<br><br>" +
                
        "We’ll be providing "+ ifCanada('money') +" codes to cover the ‘" + target_lunch_or_brunch($event_target_copy) + "’ portion of the ‘" + target_lunch_or_brunch($event_target_copy) + " and learn’, and we expect to have a strong attendance of " + $event_audience + " local to " + target_panel_4_1($event_target_copy) +".<br><br>" +

        "Are you interested in speaking on the virtual panel on " + $event_long_date + "?<br><br>" +

        "Thanks,<br><br>" +

        "Steven Etzler",

      ];

      const $rr_drafts = 
      [
        // RR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Interested in Thought Leadership on "+ $event_theme +"?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I’m organizing a virtual thought-leadership event for a group of " + $event_audience + " from " + target_2_1_area($event_target_copy) + ", and I'd like to invite you to join us.<br><br>" +

        "The agenda includes video networking in small breakout rooms and a moderated panel discussion about " + $event_snippet + ". Our expert panelists are featured—along with a list of discussion topics—on the event site below.<br>"+

        `
        <ul style='list-style:none;'>
        <li>${ $event_full_title }</li><br>
        <li>Date: ${ $event_long_date }</li><br>
        <li>Time: 12 to 1:30pm ${ $event_timezone }</li><br>
        <li>Details: event website ${ $event_website } </li><br>
        </ul>
        `+

        "We traditionally host these events at award-winning restaurants, so to keep our '" + target_lunch_or_brunch($event_target_copy) + " and learn’ structure, we’re sending " + ifCanada('money') + " codes so each attendee can enjoy a nice meal, with the option to donate it to the Food Bank for New York City if you prefer.<br><br>" +

        "Interested in joining us, {{FIRST_NAME}}? Happy to answer any questions, or to save you a spot.<br><br>"+
        
        " Cheers,<br>",

        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Connect with your peers over "+ $event_theme +"!</p><br><br>" +
        
        "Hey {{FIRST_NAME}},<br><br>" +

        "Hosting digital thought-leadership events when our specialty has always been live events means that we’re relentlessly focused on the <b>connection and interaction</b> between our attendees. <br><br>" +

        "We’re pleased to say our format facilitates peer-to-peer learning virtually—you won’t miss anything but a handshake.<br><br>" +

        $event_full_title + " will revolve around peer-to-peer networking and an interactive discussion about " + $event_content_2 + ". Our panel of speakers includes the following leaders:<br>" +

        createPanelistList_full() + 
        
        "Next time, we hope to do this at a restaurant over a 3-course meal, but for " + $event_long_date + ", may we count you in?<br><br>" +
        
        "Best,<br>Steve",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re: How Can You " + $event_goal + "?</p><br><br>" +

        "I know it’s still a bit early to think about " + target_lunch_or_brunch($event_target_copy) + " plans on " + $event_long_date + ", but how about joining us for some " +  ifCanada('no') + " and virtual networking at " + $event_full_title + "?<br><br>" +

        "We’ll be hosting a group of your peers on Zoom for a great discussion between our panelists about " + contentSnippetThree() + ".<br><br>" +

        "You’ll receive a " +  ifCanada('no') + " code so you can " + target_lunch_or_brunch($event_target_copy) + " while you learn, or you can choose to donate it to the the Food Bank for New York City.<br><br>" +

        "We’re happy to have the opportunity to connect leaders in a time where peer-to-peer learning is more valuable than ever, and yet less available.<br><br>" +

        "If the event doesn’t appeal to you, but you know someone in your organization who might be interested, please feel free to forward the invite.<br><br>" +

        "Join us?<br><br>" +

        "Best,<br>"+
        "Steve",

        // RR MESSAGE 2.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> {{FIRST_NAME}}, " + target_lunch_or_brunch($event_target_copy) + " is on us!</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I’d like to invite you and any interested colleagues to join our virtual event on " + $event_long_date + " from 12 to 1:30pm " + $event_timezone + ".<br><br>" + 

        "At " + $event_full_title + ", you’d network with an invite-only group of other " + $event_audience + " from " + target_2_1_area($event_target_copy) + ", and engage in thought-provoking discussions about " + $event_snippet + ". See details on our site " + $event_website + ".<br><br>" +

        "For this '"+ target_lunch_or_brunch($event_target_copy) + " and learn', we’ll be sharing a " + ifCanada('money') + " code, or we can donate the meal to the Food Bank for New York City in your name. The best part of these gatherings isn’t the spring rolls anyway—it’s the community of professionals we bring together.<br><br>" +

        "Join the conversation?<br><br>"+

        "Have a great rest of your day,<br><br>",

        // RR MESSAGE 2.2


        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Check out who’s attending—" + $event_short_title + "</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +
        
        "I know I’ve already reached out, but since I haven’t heard back from you, I wanted to follow up about " + $event_date_month_and_number + " as it could be a great opportunity for you to expand your professional network with peers from " + target_2_1_area($event_target_copy) + ".<br><br>" +

        $event_short_title + " is shaping up to be an exciting gathering of " + $event_audience + ".<br><br>" +

        "While we’re not able to meet face-to-face, you will still be able to network over video chat and engage in small group discussions in video breakout rooms.<br><br>" +

        "You can see who’s signed up so far here. " + $event_promo_reg_list + "<br><br>" +

        "Would you like me to reserve a spot for you?<br><br>" +

        "Cheers,<br><br>" +
        
        "Steve",

        // RR MESSAGE 2.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Hear what our expert panel has to say about " + $event_theme + "</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Circling back on my invite below—panelists from " + $event_panelists_companies + " will be sharing their insights with the group around " + $event_content_2 + ".<br><br>" +
        
        "Can I send you the agenda for " + $event_short_title + "?<br><br>" +

        "Best,<br><br>" +
        
        "Steve",

        // RR MESSAGE 3.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 3.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_Name}}, Open Spots Remaining for " + thisWeek_nextWeek_Tomorrow() + " " + $event_theme + " Event</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I know that your calendar probably fills up quickly, but we still have a couple open spots for " + $event_short_title + " on " + $event_long_date + ". The event will run from 12 to 1:30pm " + $event_timezone + ".<br><br>" +

        "Happy to save one of those spots for you. As an attendee, you’ll receive a " + ifCanada('money') + " code, so you can order up your favorite delivery while our panel leads an engaging discussion about " + contentSnippetThree() + ". If you prefer, we’re happy to donate your meal to Food Bank for New York City instead, to provide food security and other essential services for low-income New Yorkers/communities in need.<br><br>" +

        "You can find details on our panel and specific discussion topics at our event website " + $event_website + ".<br><br>" +

        "I would also be happy to include an interested colleague as your guest.<br><br>"+

        "May we count you in for our "+ target_lunch_or_brunch($event_target_copy) +", {{FIRST_NAME}}?<br><br>" +

        "Best regards,",

        // RR MESSAGE 4.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 4.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Network with Us at " + thisWeek_nextWeek_Tomorrow() + " " + $event_theme + " Event!</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        $event_full_title + " is just around the corner!<br><br>" +

        "Last call to join us " + thisWeek_nextWeek_Tomorrow_inCopy() + " " + $event_long_date + " from 12 – 1:30pm " + $event_timezone + ".<br><br>" +

        "Check out who you’d be networking with here." + $event_promo_reg_list + "<br><br>" +

        "Event details on the site here." + $event_website + "<br><br>" +

        "If you can’t make it, we host many virtual events across the country on this and other topics—I’d be happy to send relevant invites your way.<br><br>" +

        "Would you like me to RSVP you?",

        // RR MESSAGE - RESCHEDULE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment - Reschedule 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> re: Coronavirus Update: "+ $event_short_title +" changed to a virtual event</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        "Due to the recent developments with the Coronavirus and our concern for the health and safety of our attendees, we are transitioning our live event, "+$event_short_title+", from an in-person thought leadership lunch to a virtual event hosted over Zoom.<br><br>" +

        "Our original panel of speakers will still discuss "+$event_snippet+". All attendees will be encouraged to actively engage in the discussion through video chat, simulating the interactive and intimate nature of our original in-person event.<br><br>" +

        "To preserve the networking value of the lunch, attendees will be able to join small group discussions in breakout room sessions and meet other marketing leaders local to the "+ $event_city +" area.<br><br>" +

        "And while we will no longer be hosting the event at "+ $event_venue +", we will be sending all attendees a "+ ifCanada('money') +" code so everyone can still enjoy the discussion and networking over a lunch of their choice, from the comfort of their offices/homes..<br><br>" +

        "The virtual event will run tomorrow, " + $event_long_date +" from 12 pm to 1:30 pm. Full event details are available here at our event website " + $event_website + ").<br><br>" +

        "{{FIRST_NAME}}, would you like to join us?<br><br>"+

        "Best regards,",

        // LinkedIn Campaigns - Start

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Campaigns</p>" +

        "Hi NAME,<br><br>" +

        "I’d like to invite you to our virtual lunch & learn event, " + $event_short_title + " on " + $event_month_number + "/" + $event_day_number + " from 12-1:130PM " + $event_timezone + ". Details at website " + $event_website + ". We'll be sending a " + ifCanada() + " code for lunch! May I count you in? If so, please send me your email address.<br><br>",

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

        "Thank you for your response! Delighted to have you join!<br>" +

        "Here is the meeting link: "+ $event_zoom_link +"<br><br>" +

        `The agenda for the session is simple:<br>
        <ul>
        <li style="list-style: none;"><b>12:00PM Attendees Enter Virtual Event & Welcome Remarks</b></li>
        <li style="list-style: none;"><b>12:05PM Video Networking in Breakout Rooms</b></li>
        <li style="list-style: none;"><b>12:15PM Panel Discussion</b></li>
        <li style="list-style: none;"><b>12:55PM Audience Q&A</b></li>
        <li style="list-style: none;"><b>1:10PM Breakout Networking Sessions</b></li>
        </ul><br>`
        +

        `We will provide you with the food delivery code on the day of the event—stay tuned for that. Or please let us know if you’d prefer to have your meal donated to Food Bank for New York City instead.<br><br>` +

        "Please make sure to whitelist our email address to ensure the code isn't sent to spam. Looking forward to your participation!<br><br>" +

        "Steve",

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
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Please Confirm: Tomorrow's " + $event_short_title + " Virtual Meeting</p><br><br>" +

        "Hi FIRSTNAME,<br><br>" +

         highlight_This("(Following up on a voicemail we just left for you. I want to confirm your participation at tomorrow's // I want to confirm your participation at tomorrow's)") + " " + $event_short_title + " video-based virtual meeting, taking place from 12 to 1:30PM on Zoom.<br><br>" + 

        "To join the meeting, click here. "+ $event_virtual_link +"<br><br>"+

        "Please be prepared to have your <b>video and microphone on</b>.<br><br>"+

        "Please reply back to confirm your participation so we can send you a " + ifCanada('no-money') + " code for lunch! Or please let us know if you’d prefer to have your meal donated to Food Bank for New York City instead, to provide food security and other essential services for low-income New Yorkers/communities in need.<br><br>"+

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
        Steve Etzler<br>
        Business Development Institute`,

        // SEE YOU TODAY (Grubhub/Uber Eats)

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - See you today</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you today at our virtual event!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "We look forward to seeing you today at "+ highlight_This("TIME") +" at our virtual lunch & learn—" + $event_full_title +"!<br><br>" +

         "<span style='color:red;'><b>Here is your " + ifCanada(false) + " eGift card NUMBER and your PIN PINNUMBER so you may enjoy lunch, courtesy of <span style='color:red;'>"+ $event_client +"</span>! </b></span><br><br>"+

         "Please let us know if you’d prefer to have your meal donated to <b>Food Bank for New York City</b> instead, to provide food security and other essential services for low-income New Yorkers/communities in need.<br><br>" +

         "To join the meeting, please click here: " + $event_virtual_link +"<br><br>"+
         
         "The objective is to provide a virtual, video-based networking experience in addition to valuable content. Please expect to network with other participants BEFORE and AFTER the panel in breakout rooms.<br><br>" +

         "See you soon,<br>" +
         "<b>Steve Etzler</b><br>" +
         "<b>Business Development Institute</b><br>",

        // ONBOARDING PANELIST - CONFIRMED

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Onboarding Panelist - Confirmed</p>" +

         "Hi NAME,<br><br>" +

         "Great news – delighted to have you join us!<br><br>" +

         "The only thing I need from you is a headshot so we can add you to the event website " + $event_website +". Happy to grab the one you have on LinkedIn if that’s okay.<br><br>" +
 
         "My colleague " + highlight_This('AM NAME') + " (CCed above) will circle back in a few weeks to lock in a 30-minute video call to prepare for the panel. I’ll introduce you to your moderator and fellow panelists then.<br><br>" +
         
         "Please note that the virtual meeting will be recorded and by participating in this event, you are agreeing to have this recording used. Do let us know if this is an issue for you. If not, kindly fill out this brief consent form: [" + highlight_This("LINK from RSVP Base") + "]<br><br>" +
   
         "Lastly, please expect a calendar invite shortly.<br><br>" +
        
         "Thank you again, and looking forward to your panel participation!<br><br>" +
        
         "Best,<br>" +
         
         "Steve",

        // ONBOARDING PANELIST - TENTATIVE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Onboarding Panelist - Tentative</p>" +

        "Hi NAME,<br><br>" +

        "Thanks for your quick reply and interest! I’d be delighted to have you join us.<br><br>" +
        
        "For more context about the program's objectives, content, discussion topics and sponsor, you can check out the event website: " + $event_website + "<br><br>" +
        
        "The virtual panel will be a simple interactive discussion. As a panelist, you’ll simply be featured on the website. Please note that the virtual meeting will be recorded and by participating in this event you are agreeing to have this recording used. Do let us know if this is an issue for you.<br><br>" +
        
        "So far, we have received interest from the following speakers:<br>" +
        
        createPanelistList_full() +
        
        "The only ‘preparation’ needed is one 30-minute planning call (about 1 week before the event) to share more details on event logistics, and to allow the panelists to speak about their areas of interest so we can all collaborate on the topics being discussed.<br><br>" +
        
        "May we count you in?<br><br>" +
        
        "Thank you, looking forward to hearing from you!<br><br>" +
        
        "Steve",

        // SCHEDULING PANEL PREP CALL

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Scheduling Panel Prep Call</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Scheduling Panel Prep | "+ $event_short_title +"</p><br><br>" +

        "Hello all,<br><br>" +

        "We’re excited for your panel participation at " + $event_short_title + " virtual meeting, taking place on " + $event_long_date + " from 11:45AM – 1:30PM " + $event_timezone + " on our video-based platform Zoom.<br><br>" +

        "We would like to schedule a 30 minute panel practice run on "+ highlight_This("DAY, DATE") +" between "+ highlight_This("TIME") +".<br><br>"+

        "As soon as I hear back from everyone, I’ll respond with a calendar invite for the time that works best across the board.<br><br>"+

        "Thank you!<br>"+
        isBlank($event_account_manager),

        // PANEL PREP CALL AGENDA

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Prep Call Agenda</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>" + $event_short_title + " | Panel Prep</p><br><br>" +
 
        "Hi all,<br><br>"+

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
        "<li>Registration List: " + "<a href='" + $event_promo_reg_list + "'>LINK</a></li>" +
        "<li>Consent Form: " + highlight_This("(thank you if you already filled it out): LINK") + "</li></ul><br>" +

        "<b>AGENDA</b>"+
        "<li>11:45AM Panelists & Moderator join </li>"+
        "<li>12:00PM Attendees Enter Virtual Event & Welcome Remarks</li>"+
        "<li>12:05PM Video Networking in Breakout Rooms </li>"+
        "<li>12:15PM Panel Discussion</li>" +
        "<li>12:55PM Audience Q&A<br>" +
        "<li>1:10PM Breakout Networking Sessions</li></ul><br><br>" +

        "<b>LUNCH</b><br>" +
        "<p>We will provide a "+ ifCanada('money') +" code so you may enjoy lunch on the morning of the event - stay tuned for that! Or let us know if you’d prefer to have your meal donated to Food Bank for New York City instead, to provide food security and other essential services for low-income New Yorkers/communities in need.</p><br>"+

        "<b>PANEL DISCUSSION QUESTIONS</b><br>" +
        "<p>"+ highlight_This("Insert bullet points from website OR panel questions provided by moderator") + "</p><br><br>",

        // ONE WEEK REMNINDER

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> One Week Reminder (Confirmed)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you (on your webcam) next " + $event_weekday + "!</p><br><br>" +

        "Hi NAME,<br><br>"+

        "We hope you’re excited about next week’s "+ $event_full_title +" virtual lunch & learn!<br><br>"+

        "With our panel of experts, we’ve prepared a dynamic and informative list of topics for our discussion. You’ll be able to listen and share your thoughts with our impressive list of registrants below and participate in video-based networking breakout sessions.<br><br>"+

        "Here is the link to join the meeting: "+ $event_virtual_link +"<br><br>"+

        "Please be prepared to have your video and microphone on.<br><br>"+

        "This email serves as a reminder and an invite for you to share with a colleague who may also find this event valuable.<br><br>"+

        "To ensure you're able to receive your " + ifCanada('money') + " code, please make sure to whitelist our email address so the message doesn't end up in your spam folder!<br><br>" +

        "Thanks, we look forward to seeing you online from 12 to 1:30 pm on " +  $event_long_date + ".<br><br>" + 

        "Best regards,<br>" +
        "<b>Steve Etzler</b>"+
        "<b>Business Development Institute</b><br><br>"+
        
        "REGISTRATION LIST<br>"+
        highlight_This("{{{COPY AND PASTE REG LIST HERE}}}"),

        // RSVP NO - Virtual

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> RSVP NO - Response</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i>  We’ve Gone Virtual!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "You let me know a while back that you wouldn’t be able to join us at "+ $event_venue +" in " + $event_city +" for "+ $event_full_title + " on "+ $event_long_date +". At this time, due to current Coronavirus concerns, we’ve decided to take the entire event virtual!<br><br>"+
 
         "Instead of going from 12 – 2pm at the restaurant, we’ll go from 12 – 1:30pm online—the agenda will still include an interactive panel discussion, breakout session networking with your local peers, and we’ll be sending "+ ifCanada('money') +" codes to all the attendees—so lunch is still on us!<br><br>"+
 
         "Please check out the event website "+ $event_website +" and let me know if you’re able to join us—we’d love to have you, and I’m happy to save you a spot.<br><br>"+
 
         "Hope you’re staying healthy,<br><br>"+
  
         "Steve Etzler<br>" +
         "<b>Business Development Institute</b>",

        // CONFIRMATION CALLS SCRIPT

        "<p class='messagetypename'><i class='fa fa-phone'></i> Confirmation Calls Script</p><br>" +

        "Hi <span style='color:red;'>{NAME}</span>,<br><br>"+

        "This is <span style='color:red;'>{VA}</span> calling from BDI.<br><br>"+

        "We have you registered to join us at "+ $event_full_title +" tomorrow, "+ $event_long_date + " from 12-1:30PM " + $event_timezone + ".<br><br>" +

        "Please be prepared to participate via video on your computer or mobile device. We'll be providing a code for food delivery!<br><br>" +

        "If your schedule has changed and you can no longer attend, please let us know by responding to Steve's email.<br><br>" +

        "Thank you! Bye!<br><br>",

        // SEE YOU TODAY (Meal Donation)

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - See you today</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you today at our virtual event!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "We look forward to seeing you today at "+ highlight_This("TIME") +" at our virtual lunch & learn—" + $event_full_title +"!<br><br>" +

         "Thank you for choosing to donate your meal to Food Bank for New York City instead, to provide food security and other essential services for low-income New Yorkers/communities in need. You will receive an email confirming for your donation shortly. <br><br>"+

         "To join the meeting, please click here: " + $event_virtual_link +"<br><br>"+
         
         "The objective is to provide a virtual, video-based networking experience in addition to valuable content. Please expect to network with other participants BEFORE and AFTER the panel in breakout rooms.<br><br>" +

         "See you soon,<br>" +
         "<b>Steve Etzler</b><br>" +
         "<b>Business Development Institute</b><br>",

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

        "I thought you'd make a great <i>panelist</i> for a virtual " + target_lunch_or_brunch($event_target_copy) + "-and-learn event we are organizing on " + $event_long_date +" from 12 to 1:30pm " + $event_timezone + ".<br><br>" +

        $event_full_title + " will gather " + $event_audience_and_size + " " + target_2_1_area($event_target_copy) + " for video-networking in small breakout rooms before and after an interactive panel discussion. It’ll be conversational, with no formal presentations or press.<br><br>" +

        "At a high level, we are looking to explore the discussion points below, though these conversations tend to flow in the direction of attendees’ interests and the passions of our panel—we can dive into your expertise and preference in greater detail on our panel practice run:.<br>" +

        `<ul>
        <li>DISUCSSION TOPIC 1</li>
        <li>DISUCSSION TOPIC 2</li>
        <li>DISUCSSION TOPIC 3</li>
        <li>DISUCSSION TOPIC 3</li>
        </ul>` +

        "We ask a total time commitment of two hours from our panelists: 30 minutes for a panel practice run prior to the event, and attendance from 11:45am to 1:30pm " + $event_timezone + " the day of.<br><br>" +

        "Would you be open to speaking on our virtual panel, FIRST NAME?<br><br>",

        // CLIENT REGISTRANT RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>Join Us For Lunch? </p><br><br>" +

        "Hello {{FIRST_NAME}},<br><br>" +

        "Would you be interested in participating in our virtual, thought-leadership event?<br><br>" +
        
        $event_full_title + " will revolve around peer-to-peer networking for a group of " + $event_audience + " from " + target_2_1_area($event_target_copy) + ".<br><br>" +
        
        "Here are the details:<br>" + 

        `<ul>
        <li>` + $event_full_title + `</li>
        <li>Date: ` + $event_long_date + `</li>
        <li>Time: 12 to 1:30pm `+ $event_timezone + `</li>
        <li>Details: Event Site ` + $event_website + `</li>
        </ul>` +
        
        "The agenda includes video networking in small breakout rooms and a moderated panel discussion about " + $event_snippet + "<br><br>" +
        
        "Our panel includes the following leaders:<br>" +

        createPanelistList_full() +
        
        "We traditionally host these events at award-winning restaurants, so to keep our ‘"+ target_lunch_or_brunch($event_target_copy) +" and learn’ structure, we’re sending " + ifCanada('money') + " codes so each attendee can enjoy a nice meal, with the option to donate it to healthcare workers if you prefer.<br><br>"+
        
        `Interested in joining us, {{FIRST_NAME}}? To RSVP please email <a href="mailto:RSVP for the ` + $event_theme + ' ' + target_lunch_or_brunch($event_target_copy) + ' event on ' + $event_month_number + '/' + $event_day_number + `">steven.etzler@bdionline.com</a>.<br><br>` +

        "Best<br><br>",

        // FINAL ATTENDEE LIST FOR CLIENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Final Attendee List For Client - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Final Attendees & Recording | " + $event_short_title + " | " + $event_month_number + "/" + $event_day_number + "</p><br><br>" +

        "Hi all,<br><br>" +

        "Hope you enjoyed today’s event!<br><br>" +
        
        "<b>FINAL ATTENDEES</b><br>" +
        "Please <u>see here</u> " + highlight_This($event_promo_reg_list) + " for the final attendee list.<br>" +
        "I am also attaching this as a CSV.<br><br>" +
     
        "<b>OTHER LISTS</b><br>" +
        "Here is a <u>link</u> " + highlight_This($event_client_rsvp_list) + " to the data points for: RSVP No, Cancellations, No Shows, and Invite List. I am also attaching this as a CSV.<br><br>" + 

        "<b>RECORDING</b><br>" +
        "Here is the <u>" + highlight_This("link to the recording") + "</u> for INTERNAL USE ONLY. If you want to use the recordings for external purposes, please contact us regarding the panelist consent approvals that are required.<br><br>" + 
      
        "<b>POST EVENT COMMUNICATION</b><br>" +
        "Please let us know if we should include any links/collateral in the post event communication emails (thank you for attending & sorry we missed you). We will share the post event survey results with you once we have them.<br><br>" +

        "Thanks – have a great day!<br><br>" +

        $event_account_manager,
    
      ];

      const $sc_drafts = 

      [
        // CLIENT REGISTRANT RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>Join Us For Lunch? </p><br><br>" +

        "Hello {{FIRST_NAME}},<br><br>" +

        "Would you be interested in participating in our virtual, thought-leadership event?<br><br>" +
        
        $event_full_title + " will revolve around peer-to-peer networking for a group of " + $event_audience + " from " + target_2_1_area($event_target_copy) + ".<br><br>" +
        
        "Here are the details:<br>" + 

        `<ul>
        <li>` + $event_full_title + `</li>
        <li>Date: ` + $event_long_date + `</li>
        <li>Time: 12 to 1:30pm `+ $event_timezone + `</li>
        <li>Details: Event Site ` + $event_website + `</li>
        </ul>` +
        
        "The agenda includes video networking in small breakout rooms and a moderated panel discussion about " + $event_snippet + "<br><br>" +
        
        "Our panel includes the following leaders:<br>" +

        createPanelistList_full() +
        
        "We traditionally host these events at award-winning restaurants, so to keep our ‘"+ target_lunch_or_brunch($event_target_copy) +" and learn’ structure, we’re sending " + ifCanada('money') + " codes so each attendee can enjoy a nice meal, with the option to donate it to healthcare workers if you prefer.<br><br>"+
        
        `Interested in joining us, {{FIRST_NAME}}? To RSVP please email <a href="mailto:RSVP for the ` + $event_theme + ' ' + target_lunch_or_brunch($event_target_copy) + ' event on ' + $event_month_number + '/' + $event_day_number + `">steven.etzler@bdionline.com</a>.<br><br>` +

        "Best",

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
          } else if ($selectedMessageName == "Reschedule 1.1") {
            return $drafts.html($rr_drafts[8]);
          } else if ($selectedMessageName == "LinkedIn Campaigns") {
            return $drafts.html($rr_drafts[9]);
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
          } if ($selectedMessageName == "Final Attendee List for Client"){
            return $drafts.html($cc_drafts[3]);
          }
        } else if ($selectedMessageType == "Sales Communication") {
          if ($selectedMessageName == "Sales Communication"){
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
            } if ($selectedMessageName == "See You Today (Grubhub/Uber Eats)") {
              return $drafts.html($rc_drafts[5]);
            } if ($selectedMessageName == "Onboarding Panelist - Confirmed") {
              return $drafts.html($rc_drafts[6]);
            } if ($selectedMessageName == "Onboarding Panelist - Tentative") {
              return $drafts.html($rc_drafts[7]);
            } if ($selectedMessageName == "Scheduling Panel Prep Call") {
              return $drafts.html($rc_drafts[8]);
            } if ($selectedMessageName == "Panel Prep Call Agenda") {
              return $drafts.html($rc_drafts[9]);
            } if ($selectedMessageName == "One Week Reminder") {
              return $drafts.html($rc_drafts[10]);
            } if ($selectedMessageName == "Invite for RSVP NO Responses") {
              return $drafts.html($rc_drafts[11]);
            } if ($selectedMessageName == "Confirmation Calls Script") {
              return $drafts.html($rc_drafts[12]);
            } if ($selectedMessageName == "See You Today (Meal Donation)") {
              return $drafts.html($rc_drafts[13]);
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
