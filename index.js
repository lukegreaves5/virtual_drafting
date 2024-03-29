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
$airtableTodayEmails = "https://api.airtable.com/v0/appdISq2lodl6vyot/Marketing%20Emails?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine";
// ------

// -- GLOBAL VARIABLES -- 
let $inputs_container = $('#frontpage-container'),
$eventSearch = $("#eventsearch"),
$select = $("#select"),
$eventSelect = $('#event-select'),
$messageCategorySelect = $('#message-category'),
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
$RegistrantCommunicationOptions = ["Final Confirmation / Per my Voicemail", "Thanks for attending", "Sorry we missed you", "One week Reminder (Confirmed)"],
$selectedEvent = [],
$selectedMessageType = "",
$selectedMessageName = "",
loader = "<div class='load-pulse'><div class='title-pulse'></div><div class='messages-pulse'></div></div>",
messagesloading = $("#todays-drafts").append(loader,loader,loader,loader);
// ------

$("#custom-drafts-button").click(function(){
  $predraftContainer.css("display", "none");
  $draftContainer.css("display", "flex");
  $(this).css("color", "#274b75");
  $(this).css("background", "#fff");
  $("#todays-drafts-button").css("background-color", "#274b75");
  $("#todays-drafts-button").css("background-image", "linear-gradient(180deg,#274b75,#315f92)");
  $("#todays-drafts-button").css("color", "#fff");
  $("#predrafted-preview").empty();
  $("#predrafted-preview").css("background", "transparent");
  $("#predrafted-preview").append("<div id='logo-container'><div id='logo'></div><div class='logo-title'><b>Virtual Events</b></div></div>");
});

$("#todays-drafts-button").click(function(){
  $predraftContainer.css("display", "flex");
  $draftContainer.css("display", "none");
  $(this).css("color","#274b75");
  $(this).css("background", "#fff");
  $("#custom-drafts-button").css("background-color", "#274b75");
  $("#custom-drafts-button").css("background-image", "linear-gradient(180deg,#274b75,#315f92)");
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
      if (record.fields["Outreach"] == null || record.fields["Outreach"] == undefined) {
        return record.fields["Message Type"];
      } else if (record.fields["Outreach"] == "Confirmed") {
        return "One Week Reminder (Confirmed)";
      } else if (record.fields["Outreach"] == "Tentative") {
        return "One Week Reminder (Tentative)";
      } else return record.fields["Outreach"];
  };


  // An object is created for each sender and they are given an array of message objects filtered from Airtable if their name matches the sender field from Airtable.
  let arr = [];
  $senders.map(sender => {
    data.filter(function(record) {
      if (record.fields.Sender.name == sender.sender) { // if email campaign sender matches the sender object's name.
        arr.push({
          emailName: record.fields.Email,
          eventRecordId: record.fields.Event,
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
    $("#todays-drafts-button").css("background-color", "#274b75");
    $("#todays-drafts-button").css("background-image", "linear-gradient(180deg,#274b75,#315f92)");
    $("#todays-drafts-button").css("color", "#fff");
    $("#custom-drafts-button").css("background", "#fff");
    $("#custom-drafts-button").css("color", "#274b75");

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
    console.log(thisRecord);
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
      } else if ($messageNameSelect[0].value == "Outreach"){
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
      $event_account_director_first_name = accountDirectorFormat_firstName(objectCheck(['AD'])),
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
      $event_panel_snippet = objectCheck(['Panel Snippet']),
      $event_snippet = objectCheck(['Content Snippet']),
      $event_content_2 = objectCheck(['Content Snippet 2']),
      $event_content_3 = objectCheck(['Content Snippet 3']),
      $event_promo_reg_list = objectCheck(['PromoRegList']),
      $event_client_rsvp_list = objectCheck(['Client RSVP List']),
      $event_moderator_full_name = objectCheck(['moderator_api']),
      $event_moderator_company = objectCheck(['Moderator Company']),
      $event_venue_address = objectCheck(['(Map) Venue Address']),
      $event_function = objectCheck(['Function']),
      $event_function_leaders = objectCheck(['Function leaders']),
      $event_audience = objectCheck(['Audience']),
      $event_target = objectCheck(['Event Size']),
      $event_benefit = objectCheck(['Benefit']), //$event.Benefit,
      $event_audience_and_size = objectCheck(['Event Size']) + " " + objectCheck(['Audience']),
      $event_audience_and_size_or_so = objectCheck(['Event Size']) + " or so " + objectCheck(['Audience']),
      $event_venue = objectCheck(['venue_api']),
      $event_parking = objectCheck(['parking_api']),
      $event_website = objectCheck(['website_api']),
      $event_survey = "https://airtable.com/shrvy749ZtQCE9gJ6", //objectCheck(['Survey']),
      $event_moderator_first_name = objectCheck(['Moderator First Name']),
      $event_panelists_first_name = objectCheck(['speakers_first_name_api']),
      $event_panelists_last_name = objectCheck(['speakers_last_name_api']),
      $event_panelists_titles = objectCheck(['speakers_title_api']),
      $event_panelists_companies = objectCheck(['speakers_companies_api']),
      $event_panelists_full_formatted = objectCheck(['Formatted_speakers_details_api']),
      $event_moderator_full_formatted = objectCheck(['Formatted_moderator_details_api']),
      $event_panelists_title_and_company = objectCheck(['Formatted_speakers_title_company_api']),
      $speakers_names_linkedin_api = objectCheck(['speakers_names_linkedin_api']),
      $event_virtual_link = objectCheck(['Zoom Link']),
      $event_days_away = objectCheck(['Days Away']),
      $event_target_copy = objectCheck(['Target']),
      $event_target_region = objectCheck(['Region']),
      $event_target_vertical = objectCheck(['Vertical']),
      $event_timezone = objectCheck(['Timezone']),
      $event_theme = objectCheck(['Content Theme']),
      $event_goal = objectCheck(['Content Goal']),
      $event_zoom_link = objectCheck(['Zoom Link']),
      $event_customization_1 = objectCheck(['Customization 1']),
      $event_customization_2 = objectCheck(['Customization 2']),
      $event_subject = objectCheck(['Subject']),
      $event_discussion_topics = objectCheck(['Discussion Topics']),
      $event_local_time = objectCheck(['Event Start Time']),
      $event_time_display = objectCheck(['Event Start Time']) + " - " + objectCheck(['Event End Time']),
      $event_start_time = objectCheck(['Event Start Time']),
      $event_end_time = objectCheck(['Event End Time']),
      $event_time_EST = objectCheck(['Event Time (EST)']),
      $event_panel_highlight = objectCheck(['Panel Highlight']),
      $event_registrant_JSON = objectCheck(['Registrant List JSON']);


      function createRegistrantCompaniesList() {
        //JSON.parse($event_registrant_JSON)
        if (!$event_registrant_JSON.includes("yellow")) {
          let jsonParsed = JSON.parse($event_registrant_JSON);
          let companies = [];
          jsonParsed.forEach(registrant => {
            companies.push(" " + registrant.Company)
          })
          companies.sort();
          return companies.toString();
        }
        else return $event_registrant_JSON
      }

      function dynamic_attendee_Agenda() {
        let timezone;
        switch($event_timezone[0]) {
          case "EST":
            timezone = "America/New_York";
            break;
          case "CST":
            timezone = "America/Chicago";
            break;
          case "MST":
            timezone = "America/Denver";
            break;
          case "PST":
            timezone = "America/Los_Angeles";
            break;
          default:
        }

        Date.prototype.addMinutes = function(h) {
          this.setMinutes(this.getMinutes() + h);
          return this;
        };

        let eventDate = moment($event_date_full_numeric);
        let start;
        if (!$event_time_display.includes("yellow")) { // if Event time Display field is filled
          start = new Date( new Date(eventDate).setHours( $event_time_display[0].split("-")[0].split(":")[0] ) ); // Calculate start time. Event Time Display field is required.
          return (
            `
              <li style="list-style: none;">${ moment(start).format('h:mm') }pm Attendees Enter Virtual Event & Welcome Remarks</li>
              <li style="list-style: none;">${ moment(start.addMinutes(5)).format('h:mm') }pm Video Networking in Breakout Rooms</li>
              <li style="list-style: none;">${ moment(start.addMinutes(10)).format('h:mm') }pm Panel Discussion</li>
              <li style="list-style: none;">${ moment(start.addMinutes(40)).format('h:mm') }pm Audience Q&A</li>
              <li style="list-style: none;">${ moment(start.addMinutes(15)).format('h:mm') }pm Breakout Networking Sessions</li>
            `
          )
        } else if (!$event_time_EST.includes("yellow")) { // if Event time Display field is not filled but Event time EST field is
          console.log("Event time display does not exist");
          return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:00PM Attendees Enter Virtual Event & Welcome Remarks</li>
              <li style="list-style: none;">12:05PM Video Networking in Breakout Rooms</li>
              <li style="list-style: none;">12:15PM Panel Discussion</li>
              <li style="list-style: none;">12:55PM Audience Q&A</li>
              <li style="list-style: none;">1:10PM Breakout Networking Sessions</li>
            `
          )
        } else return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:00PM Attendees Enter Virtual Event & Welcome Remarks</li>
              <li style="list-style: none;">12:05PM Video Networking in Breakout Rooms</li>
              <li style="list-style: none;">12:15PM Panel Discussion</li>
              <li style="list-style: none;">12:55PM Audience Q&A</li>
              <li style="list-style: none;">1:10PM Breakout Networking Sessions</li>
            `
        )
      };


      function final_confirmation_agenda() {
        let timezone;
        switch($event_timezone[0]) {
          case "EST":
            timezone = "America/New_York";
            break;
          case "CST":
            timezone = "America/Chicago";
            break;
          case "MST":
            timezone = "America/Denver";
            break;
          case "PST":
            timezone = "America/Los_Angeles";
            break;
          default:
        }

        Date.prototype.addMinutes = function(h) {
          this.setMinutes(this.getMinutes() + h);
          return this;
        };

        let eventDate = moment($event_date_full_numeric);
        let start;
        if (!$event_time_display.includes("yellow")) { // if Event time Display field is filled
          start = new Date( new Date(eventDate).setHours( $event_time_display[0].split("-")[0].split(":")[0] ) ); // Calculate start time. Event Time Display field is required.
          return (
            `
              <li style="list-style: none;">${ moment(start).format('h:mm') } - ${ moment(start.addMinutes(15)).format('h:mm') }pm <b>Networking in Virtual Breakout Rooms</b></li>
              <li style="list-style: none;">${ moment(start).format('h:mm') } - ${ moment(start.addMinutes(55)).format('h:mm') }pm <b>Moderated Panel Panel Discussion</b> w/ interactive Q&A</li>
              <li style="list-style: none;">${ moment(start).format('h:mm') } - ${ moment(start.addMinutes(20)).format('h:mm') }pm <b>Back to Breakouts</b> for more interactive discussion</li>
            `
          )
        } else if (!$event_time_EST.includes("yellow")) { // if Event time Display field is not filled but Event time EST field is
          console.log("Event time display does not exist");
          return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:00 - 12:15pm: <b>Networking in Virtual Breakout Rooms</b></li>
              <li style="list-style: none;">12:15 - 1:00pm: <b>Moderated Panel Panel Discussion</b> w/ interactive Q&A</li>
              <li style="list-style: none;">12:10 - 1:15pm: <b>Back to Breakouts</b> for more interactive discussion</li>
            `
          )
        } else return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:00 - 12:15pm: <b>Networking in Virtual Breakout Rooms</b></li>
              <li style="list-style: none;">12:15 - 1:00pm: <b>Moderated Panel Panel Discussion</b> w/ interactive Q&A</li>
              <li style="list-style: none;">12:10 - 1:15pm: <b>Back to Breakouts</b> for more interactive discussion</li>
            `
        )
      };

      function dynamic_client_Agenda() {
        Date.prototype.addMinutes = function(h) {
          this.setMinutes(this.getMinutes() + h);
          return this;
        };

        let eventDate = moment($event_date_full_numeric);
        let start;
        if (!$event_time_display.includes("yellow")) { // if Event time Display field is filled
          start = new Date( new Date(eventDate).setHours( $event_time_display[0].split("-")[0].split(":")[0] ) ); // Calculate start time. Event Time Display field is required.
          return (
            `
              <li style="list-style: none;">${ moment(start.addMinutes(-15)).format('h:mm A') } The moderator and panel will join 15 minutes early to chat through any last questions and get ready for the event to start.</li>
              <li style="list-style: none;">${ moment(start.addMinutes(15)).format('h:mm A') } The event starts, attendees are let in, welcome remarks.</li>
              <li style="list-style: none;">${ moment(start.addMinutes(5)).format('h:mm A') } Panel discussion begins. The moderator will introduce themselves, and ask the panel to do the same.</li>
              <li style="list-style: none;">${ moment(start.addMinutes(10)).format('h:mm A') } We will open it up for audience Q&A</li>
              <li style="list-style: none;">${ moment(start.addMinutes(40)).format('h:mm A') } Break out into smaller groups for very interactive discussions on the same or adjacent topics to the ones we covered on the panel—attendees will be able to share their experiences as well.</li>
              <li style="list-style: none;">${ moment(start.addMinutes(15)).format('h:mm A') } We’ll head back to the main room to say a quick goodbye and the event ends.</li>
            `
          )
        } else if (!$event_time_EST.includes("yellow")) { // if Event time Display field is not filled but Event time EST field is
          console.log("Event time display does not exist");
          return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:45AM The moderator and panel will join 15 minutes early to chat through any last questions and get ready for the event to start.</li>
              <li style="list-style: none;">1:00PM The event starts, attendees are let in, welcome remarks.</li>
              <li style="list-style: none;">1:05PM Panel discussion begins. The moderator will introduce themselves, and ask the panel to do the same.</li>
              <li style="list-style: none;">1:40PM We will open it up for audience Q&A</li>
              <li style="list-style: none;">1:50PM Break out into smaller groups for very interactive discussions on the same or adjacent topics to the ones we covered on the panel—attendees will be able to share their experiences as well.</li>
              <li style="list-style: none;">2:13 - 2:15PM We’ll head back to the main room to say a quick goodbye and the event ends.</li>
            `
          )
        } else return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li style="list-style: none;">12:45AM The moderator and panel will join 15 minutes early to chat through any last questions and get ready for the event to start.</li>
              <li style="list-style: none;">1:00PM The event starts, attendees are let in, welcome remarks.</li>
              <li style="list-style: none;">1:05PM Panel discussion begins. The moderator will introduce themselves, and ask the panel to do the same.</li>
              <li style="list-style: none;">1:40PM We will open it up for audience Q&A</li>
              <li style="list-style: none;">1:50PM Break out into smaller groups for very interactive discussions on the same or adjacent topics to the ones we covered on the panel—attendees will be able to share their experiences as well.</li>
              <li style="list-style: none;">2:13 - 2:15PM We’ll head back to the main room to say a quick goodbye and the event ends.</li>
            `
        )
      };

      function dynamic_virtual_event_flow() {
        Date.prototype.addMinutes = function(h) {
          this.setMinutes(this.getMinutes() + h);
          return this;
        };

        let eventDate = moment($event_date_full_numeric);
        let start;
        if (!$event_time_display.includes("yellow")) { // if Event time Display field is filled
          start = new Date( new Date(eventDate).setHours( $event_time_display[0].split("-")[0].split(":")[0] ) ); // Calculate start time. Event Time Display field is required.
          return (
            `
              <li>${ moment(start.addMinutes(-30)).format('h:mm A') }  Practice Run for Sales Team</li>
              <li>${ moment(start.addMinutes(15)).format('h:mm A') }  Panelists Join Virtual Event</li>
              <li>${ moment(start.addMinutes(15)).format('h:mm A') }  Attendees Enter Virtual Event & Welcome Remarks</li>
              <li>${ moment(start.addMinutes(5)).format('h:mm A') }  Video Networking in Breakout Rooms</b></li>
              <li style="list-style:none;padding-left:5px;">Breakout 1: Sales reps asking each person to introduce themselves and share what they are looking to get out of the event</li>
              <li>${ moment(start.addMinutes(10)).format('h:mm A') }  Panel Discussion</li>
              <li>${ moment(start.addMinutes(40)).format('h:mm A') }  PM Audience Q&A</li>
              <li>${ moment(start.addMinutes(20)).format('h:mm A') }  Breakout Networking Sessions</li>
              <li style="list-style:none;padding-left:5px;">Breakout 2: Sales reps can ask open ended questions to get the conversation flowing</li>
              <li>${ moment(start.addMinutes(15)).format('h:mm A') }  Event formally ends</li>
            `
          )
        } else if (!$event_time_EST.includes("yellow")) { // if Event time Display field is not filled but Event time EST field is
          console.log("Event time display does not exist");
          return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li>11:30AM  Practice Run for Sales Team</li>
              <li>11:45AM  Panelists Join Virtual Event</li>
              <li>12:00PM  Attendees Enter Virtual Event & Welcome Remarks</li>
              <li>12:05PM  Video Networking in Breakout Rooms</b></li>
              <li style="list-style:none;padding-left:5px;">Breakout 1: Sales reps asking each person to introduce themselves and share what they are looking to get out of the event</li>
              <li>12:15PM  Panel Discussion</li>
              <li>12:55PM  PM Audience Q&A</li>
              <li>1:10PM Breakout Networking Sessions</li>
              <li style="list-style:none;padding-left:5px;">Breakout 2: Sales reps can ask open ended questions to get the conversation flowing</li>
              <li>1:15PM Event formally ends</li>
            `
          )
        } else return (
            `
              <p style="background-color:yellow;">Agenda is not dynamic: [Event Time Display] field is require in Airtable</p>
              <li>11:30AM  Practice Run for Sales Team</li>
              <li>11:45AM  Panelists Join Virtual Event</li>
              <li>12:00PM  Attendees Enter Virtual Event & Welcome Remarks</li>
              <li>12:05PM  Video Networking in Breakout Rooms</b></li>
              <li style="list-style:none;padding-left:5px;">Breakout 1: Sales reps asking each person to introduce themselves and share what they are looking to get out of the event</li>
              <li>12:15PM  Panel Discussion</li>
              <li>12:55PM  PM Audience Q&A</li>
              <li>1:10PM Breakout Networking Sessions</li>
              <li style="list-style:none;padding-left:5px;">Breakout 2: Sales reps can ask open ended questions to get the conversation flowing</li>
              <li>1:30PM Event formally ends</li>
            `
        )
      };

      function agenda_for_calendar_invite() {
          return (
            `
              <li><b>11:45AM:</b> The moderator and panel will join 15 minutes early to chat through any last questions and get ready for the event to start.</li>
              <li><b>12:00PM:</b> The event starts, attendees are let in, welcome remarks.</li>
              <li><b>12:05PM:</b> We move to smaller groups of 6-10 in breakout rooms to go through introductions and some networking all around.</li>
              <li><b>12:15PM:</b> We’ll come back to the main room for the panel discussion. The moderator will introduce themselves, and ask the panel to do the same.</li>
              <li><b>1:10PM:</b> Back to our smaller groups for very interactive discussions on the same or adjacent topics to the ones we covered on the panel—attendees will be able to share their experiences as well.</li>
              <li><b>1:28 - 1:30pm:</b> We’ll head back to the main room to say a quick goodbye and the event ends.</li>
            `
          )
      };

      function accountDirectorFormat_firstName(AD) {
        if (AD = "HD") {
          return "Hope"
        } else if (AD = "SPL") {
          return "Steph"
        } else if (AD = "SE") {
          return "Steve"
        } else return AD;
      };

      function objectCheck(propCheck) {
        if (propCheck == "Zoom Linnk") {
          propcheck = "Link";
        }
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

      console.log("Missing Fields:");
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

      function createPanelistList_title_company_only(panelist_list) { //createPanelistList_title_company_only($event_panelists_title_and_company)
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

      function createPanelistList_full_title_company_only_listFormat() { //$event_panelists_title_and_company
        if ($event_panelists_title_and_company.includes("yellow") == true) {
          return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>";
        } else {
          if ($event_panelists_title_and_company !== undefined) {
          let listOpen = '<ul style="list-style:none">'
          $event_panelists_title_and_company.forEach(panelist => {
            listOpen += '<li>'+ panelist.charAt(0).toUpperCase() + panelist.slice(1) + '</li>';
          });
          listOpen += '</ul>';
          return listOpen;
          } else return;
        }
      };

      function createPanelistList_full_title_company_only_listFormat_excluding_moderator() { //$event_panelists_title_and_company
        if ($event_panelists_title_and_company.includes("yellow") == true) {
          return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>";
        } else {
          if ($event_panelists_title_and_company !== undefined) {
          let listOpen = '<ul>'
          $event_panelists_title_and_company.forEach(panelist => {
            if (panelist) {
              if (!panelist.includes($event_client)) {
                listOpen += '<li>'+ panelist.charAt(0).toUpperCase() + panelist.slice(1) + '</li>';
              }
            } else return;
          });
          listOpen += '</ul>';
          return listOpen;
          } else return;
        }
      };

      function checkLinkedInURLExists(panelist) {
        if (panelist && panelist.includes("linkedin")) {
          return panelist;
        } else return panelist + " " + highlight_This("Add LinkeIn URL");
      }

      function createPanelistList_first_and_last_name_linkedin() { //
        console.log($speakers_names_linkedin_api);
        if ($speakers_names_linkedin_api.includes("yellow") == true) {
          return "<span style='background-color:yellow;text-transform:uppercase;'>PANELISTS MISSING</span>";
        } else {
          if ($speakers_names_linkedin_api) {
          let listOpen = '<ul>'
          $speakers_names_linkedin_api.forEach(panelist => {
              listOpen += '<li>'+ checkLinkedInURLExists(panelist) + '</li>';
          });
          listOpen += '</ul>';
          return listOpen;
          } else return;
        }
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

      function target_subject() {
        if ($event_target_region.includes("yellow") == true) {
          return $event_target_vertical
        } else return $event_target_region
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

      function insertPersonalizationTemplate(template) {
        if (template === 1) {
          console.log("Theme" + $event_theme)
          return (
            "I came across your LinkedIn profile looking for professionals who might be interested in " + $event_theme + " thought leadership. I see that you’ve been at your role with " + highlight_This("COMPANY") + " for " + highlight_This("#") + " years, and in the " + highlight_This("INDUSTRY") + " space for a lot longer."
            )
        } else if (template === 2) {
          return (
            "I came across your LinkedIn looking for " + highlight_This("PROSPECT_GENERAL_TITLEs") + ", and I saw " + highlight_This("RECOMMEDER_NAME’s") + " recommendation — " + highlight_This("he/she") + " mentioned you " + highlight_This("RECOMMENDATION_INDIRECT_QUOTE") + ", and it caught my eye."
            )
        } else if (template === 3) {
          return (
            "I came across your LinkedIn profile looking for professionals who might be interested in " + $event_theme + " thought leadership, and loved seeing your journey from " + highlight_This("PRIOR_ROLE") + " to " + highlight_This("CURRENT_ROLE") + "—I’m sure your " + highlight_This("PRIOR_INDUSTRY") + " background lends some interesting insight into what you’ve been up to at " + highlight_This("COMPANY") + "."
            )
        } else if (template === 4) {
          return (
            "You’ve got " + highlight_This("#") + " endorsements on LinkedIn for your " + highlight_This("SKILL_TYPE") + " skills and " + highlight_This("#") + " for " + highlight_This("SKILL_TYPE2") + "—definitely caught my attention."
            )
        } else if (template === 5) {
          return (
            "I came across your LinkedIn looking for " + highlight_This("PROSPECT_GENERAL_TITLEs") + ", and I saw you mention in your ‘about’ section that you " + highlight_This("ABOUT_QUOTE") + "."
            )
        } else if (template === 6) {
          return (
            "I came across you on LinkedIn looking for " + highlight_This("PROSPECT_GENERAL_TITLEs") + ", and I saw you’ve got <b>" + highlight_This("A_CERTIFICATION_CERTIFICATIONS") + "</b> in " + highlight_This("CERTIFICATION") + " and " + highlight_This("CERTIFICATION_2") + "—definitely caught my attention."
            )
        } else if (template === 7) {
          return (
            "I saw on your LinkedIn that one of your interests is " + highlight_This("INTEREST") + "—I thought " + highlight_This("HIS/HER/THEIR") + " recent " + highlight_This("ARTICLE/VIDEO/POST") + " on " + highlight_This("TOPIC") + " was a great one."
            )
        }else if (template === 8) {
          return (
            "I saw on LinkedIn that you’re the " + highlight_This("TITLE") + " at " + highlight_This("COMPANY") + ". I thought about reaching out to you on LinkedIn, but I wasn’t sure if you’re very active there — figured shooting you a quick email would be better."
          )
        }
      }

      function emailFooter() {
        return (
          `<small style='color:lightgray;'>
          Business Development Institute<br>
          40 Exchange Place, Suite 1402, New York NY 10005<br><br>
          <i>If you are not interested in further communications from us, please let us know by simply responding to this email.</i>
          </small>`
        )
      }

      let personalizationListOptions = document.querySelectorAll(".personalization-list li");
      personalizationListOptions.forEach(option => {
        option.addEventListener("click", function() {
          document.querySelector(".open-personalization1") ? document.querySelector(".open-personalization1").remove() : null;
          document.querySelector(".personalization1") ? document.querySelector(".personalization1").innerHTML = insertPersonalizationTemplate(option.value) : null;
          console.log(insertPersonalizationTemplate(option.value))
          document.querySelector(".open-personalization2") ? document.querySelector(".open-personalization2").remove() : null;
          document.querySelector(".personalization2") ? document.querySelector(".personalization2").innerHTML = insertPersonalizationTemplate(option.value) : null;
          return;
        });
      });

      function discussionTopics() {
        if ($event_discussion_topics.includes("yellow") !== -1 && $event_discussion_topics.includes("•") !== -1) {
          let bullets = $event_discussion_topics.split("•");
          return (
            "<ul>" +
              bullets.map(bullet => {
                if (bullet !== "") {
                  return "<li>" + bullet.replace(/\n/ig, '') + "</li>"
                }
              }).join('')
            + "</ul>"
          )
        } else return(
            `<ul>
              <li>DISUCSSION TOPIC 1</li>
              <li>DISUCSSION TOPIC 2</li>
              <li>DISUCSSION TOPIC 3</li>
              <li>DISUCSSION TOPIC 4</li>
            </ul>`
        )
      };

      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var d = new Date();
      var dayName = days[d.getDay()];

      const $pr_drafts_cold_new_copy = 
      [
        // COLD PANEL RECRUITMENT TEST - NEW COPY - JULY, 2021
        
        // PR MESSAGE 1.1
        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab17" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab18" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab17">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Panel Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> Panel Invite for ${ $event_month_number }/${ $event_day_number }</p><br><br>

              Hey {{FIRST_NAME}},<br><br>

              <span class='personalization1'></span>

              Based on your profile, I thought you’d make an exceptional panelist for a virtual thought-leadership event I’m organizing on ${ $event_long_date } from 11:45 am to 1:15pm ${ $event_timezone }.<br><br>

              ${ $event_full_title } will be an invite-only discussion between ${ highlight_This("# or so") } ${ $event_function_leaders } over ${ $event_panel_snippet }.<br><br>

              As a panelist, you’ll have the chance to share your insights and learn from your fellow attendees, network with your peers, and final attendees can enjoy lunch on us with a meal delivery code sent after the event.<br><br>

              If you agree you’d be a good fit, may I send you more info on the discussion topics?<br><br>

              Have a great ${highlight_This("Send Day")} <br><br>

              ${highlight_This("SIGNATURE")} <br><br>

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab18">
              
            <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Panel Recruitment 1.1 - NEW COPY</p>
            <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${ $event_month_number }/${ $event_day_number } For a Charitable Cause</p><br><br>

            Hey {{FIRST_NAME}},<br><br>

            <span class='personalization1'></span>

            Based on your profile, I thought you’d make an exceptional panelist for a virtual thought-leadership event I’m organizing on ${ $event_long_date } from 11:45 am to 1:15pm ${ $event_timezone }.<br><br>

            ${ $event_full_title } will be an invite-only discussion between ${ highlight_This("# or so") } ${ $event_function_leaders } over ${ $event_panel_snippet }.<br><br>

            As a thank you for joining, we'll send all final participants a $30 code to support the charity of  your choice. Instead of providing our panelists with a free lunch, we’re hoping you’ll help us to do some good in the world by giving to local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>

            If you agree you’d be a good fit, may I send you more info on the discussion topics?<br><br>

            Have a great ${highlight_This("Send Day")} <br><br>

            ${highlight_This("SIGNATURE")} <br><br>

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Panel Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" +
        
        "Hi {{FIRST_NAME}},<br><br>" +

        "I just wanted to follow up and share the event website for " + $event_short_title + ", linked here.<br><br>" +

        "On it, you can find all of the proposed discussion topics, but we’d also love to hear your input on the content to provide the highest value for the " + $event_function_leaders + " who will be participating in the event. <br><br>" +

        "Are you interested in speaking on these topics? Would you like to propose any additional points for discussion?<br><br>" +

        "Hope you’re having a great week.<br><br>" +

        "Cheers,",
        

        // PR MESSAGE 1.3

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab19" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab20" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab19">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Panel Recruitment 1.3 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>

              {{FIRST_NAME}}, just want to say one more time—I think you’d make an awesome panelist.<br><br>

              Our discussion of ${ $event_theme } promises to be valuable to all, but the conversation would definitely benefit from your experience.<br><br>

              Hope you’re willing to share and also interested in the opportunity to network with other ${ $event_function_leaders }.<br><br>

              And don’t forget, lunch is on us!<br><br>

              Can I count you in for ${ $event_long_date }?<br><br>

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab20">
              
            <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Panel Recruitment 1.3 - NEW COPY</p>
            <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${ $event_month_number }/${ $event_day_number } For a Charitable Cause</p><br><br>

            {{FIRST_NAME}}, just want to say one more time—I think you’d make an awesome panelist.<br><br>

            Our discussion of ${ $event_theme } promises to be valuable to all, but the conversation would definitely benefit from your experience.<br><br>

            Hope you’re willing to share and also interested in the opportunity to network with other ${ $event_function_leaders }.<br><br>

            And don’t forget, we’ll send you a code to donate to the charity of your choice after the event!<br><br>

            Can I count you in for ${ $event_long_date }?<br><br>

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

         // PR MESSAGE 2.1

         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 2.1 - NEW COPY</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> Join us as an attendee on " + $event_month_number + "/" + $event_day_number + "?</p><br><br>" +
 
         `Hey {{FIRST NAME}}<br><br>
 
         I sent you an invitation a few weeks ago to join the panel for our virtual event on ${ highlight_This("{{INDSUTRY}}") }, but now that our panel is full, I wanted to circle back and invite you to participate as an attendee.<br><br>
 
         At ${ $event_full_title } on ${ $event_long_date } from ${ $event_time_display } ${ $event_timezone }, we’ll be chatting with a group of ${ $event_audience } about strategies they’ve developed for ${ $event_panel_snippet }.<br><br>
         
         Our goal is for you to make connections with peers who are having the same, real life problems as you and to walk away with actionable takeaways you can share with your team.<br><br>
                 
         Can I count you in for ${ $event_month_number }/${ $event_day_number }? You’re welcome to invite an interested coworker to the discussion as well.<br><br>

         Happy ${highlight_This("Send Day")}!<br><br>
 
         SIGNATURE`,

          // PR MESSAGE 2.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 2.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" +

        `Hi again ${ highlight_This("{{FIRST_NAME}}") }<br><br>
 
        Reaching out one final time about our ${$event_short_title} event. We have a really phenomenal group of panelists speaking on ${ $event_month_number }/${ $event_day_number } I wanted to share with you. Check them out:<br><br>

        ${ createPanelistList_full() } <br><br>

        ${ $event_panel_highlight } ${ highlight_This("(EVENT PANEL HIGHLIGHT)")}

        If you’re able to join us, you’ll get the chance to ask the speakers questions in real-time and to chat with the panelists and fellow attendees in smaller breakout rooms to discuss the event topics. We’ll also send all we’ll final attendees a gift card to use with your favorite meal delivery service. Your next coffee, pizza, or late-night snack is on us!<br><br>
        
        Are you interested in attending, ${ highlight_This("{{FIRST_NAME}}") }?<br><br>

        Hope to see you there!<br><br>

        SIGNATURE`,

      ];

      const $pr_drafts_oi_new_copy = 
      [
        // OPT-IN PANEL RECRUITMENT TEST - NEW COPY - JULY, 2021
        
        // PR MESSAGE 1.1

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab21" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab22" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab21">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, your invite as promised ✉️</p><br><br>
      
              Hey {{FIRST_NAME}},<br><br>
      
              Reaching out because you were interested in our thought leadership event, ${highlight_This("{{SNIPPET 3-PAST_EVENT}}")}, in ${highlight_This("{{SNIPPET 4-MONTH}}")} ${highlight_This("{{SNIPPET 5-YEAR}}")}.<br><br>
      
              As ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I thought you’d make a great addition to the panel for our upcoming virtual  event, ${$event_full_title}, on ${$event_long_date} from 11:45am – 1:15pm ${$event_timezone}. This time, our conversation will revolve around ${$event_panel_snippet}.<br><br>
      
              As a refresh on our format, we will have ${highlight_This("#")} or so ${$event_function_leaders} join for a panel discussion, bookended by two breakout room sessions for networking and small group conversations.<br><br>
      
              Lunch is on us in the form of a meal delivery code sent after the event, or attendees also have the option of donating their meal to New York City-based charities if you prefer.<br><br>
      
              You can find further details on the proposed discussion topics on our event website.<br><br>
      
              May I confirm your interest and follow up with additional details?<br><br>
      
              Cheers,<br>
              Steve Etzler<br><br>

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab22">
              
              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${$event_month_number}/${$event_day_number} For a Charitable Cause</p><br><br>
      
              Hey {{FIRST_NAME}},<br><br>
      
              Reaching out because you were interested in our thought leadership event, ${highlight_This("{{SNIPPET 3-PAST_EVENT}}")}, in ${highlight_This("{{SNIPPET 4-MONTH}}")} ${highlight_This("{{SNIPPET 5-YEAR}}")}.<br><br>
      
              As ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I thought you’d make a great addition to the panel for our upcoming virtual  event, ${$event_full_title}, on ${$event_long_date} from 11:45am – 1:15pm ${$event_timezone}. This time, our conversation will revolve around ${$event_panel_snippet}.<br><br>
      
              As a refresh on our format, we will have ${highlight_This("#")} or so ${$event_function_leaders} join for a panel discussion, bookended by two breakout room sessions for networking and small group conversations.<br><br>
      
              As a thank you for joining, we'll send all final participants a $30 code to support the charity of  your choice. Instead of providing our panelists with a free lunch, we’re hoping you’ll help us to do some good in the world by giving to local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>
      
              You can find further details on the proposed discussion topics on our event website.<br><br>
      
              May I confirm your interest and follow up with additional details?<br><br>
      
              Cheers,<br>
              Steve Etzler<br><br>

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)
        
        "Hey {{FIRST_NAME}},<br><br>" +

        "Reaching back out to see if you’ve had a chance to check out our event site and the discussion topics?<br><br" +

        "Our panelists tell us that these events are not only a great opportunity to demonstrate their expertise and build their personal brand, but also to learn from their fellow attendees. <br>" +

        "Also, if you’re interested in the event, but not in speaking, you’re more than welcome to join us as an attendee.<br><br>" +

        "Let me know!<br><br>" +

        "Happy " + highlight_This("SEND DAY") + "<br><br>"
        ,

        // PR MESSAGE 1.3

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab23" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab24" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab23">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 1.3 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
       
              {{FIRST_NAME}}, just want to say one more time—I think you’d make an awesome panelist.<br><br>
      
              Our discussion of ${$event_theme} promises to be valuable to all, but the conversation would definitely benefit from your experience.<br><br>
      
              Hope you’re willing to share and also interested in the opportunity to network with other ${$event_function_leaders}.<br><br>
      
              Can I count you in for ${$event_long_date}?<br><br>
      
              Steve

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab24">
              
              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 1.3 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${$event_month_number}/${$event_day_number} For a Charitable Cause</p><br><br>
      
              Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")} <br><br>
      
              Wanted to invite you to speak on our ${$event_theme} virtual panel one last time.<br><br>
      
              We’d love to hear your thoughts as a thought leader in the space, and I think you’d really enjoy the networking opportunities with fellow $event_audience . And, who doesn’t love to order a delicious lunch?<br><br>
      
              If you prefer to sit in and listen, I’m happy to RSVP you as an attendee, rather than a panelist.<br><br>

              And don’t forget, we’ll send you a code to donate to the charity of your choice after the event!
      
              Can I count you in for ${$event_long_date}?<br><br>
      
              Steve

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // PR MESSAGE 2.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 2.1 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Join us as an attendee on " + $event_month_number + "/" + $event_day_number + "?</p><br><br>" + //target_subject($event_target_copy)

        "I sent you an invitation a few weeks ago to join the panel for our virtual event on " + highlight_This("INDUSTRY") + ", but now that our panel is full, I wanted to circle back and invite you to participate as an attendee.        <br><br>" +

        "At " + $event_full_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", we’ll be chatting with a group of " + $event_audience + " about strategies they’ve developed for " + $event_panel_snippet + ".<br><br>" +

        "Our goal is for you to make connections with peers who are having the same, real life problems as you and to walk away with actionable takeaways you can share with your team.<br><br>" +

        "Can I count you in for " + $event_month_number + "/" + $event_day_number + "? You’re welcome to invite an interested coworker to the discussion as well.<br><br>" +

        "Happy " + highlight_This("SEND DAY") + "<br><br>" + 

        highlight_This("SIGNATURE"),

         // PR MESSAGE 2.2

         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Panel Recruitment 2.2 - NEW COPY</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)

         "Hi again {{FIRST NAME}},<br><br>" +

         "Reaching out one final time about our " + $event_short_title + " event. We have a really phenomenal group of panelists speaking on "+ $event_month_number + "/" + $event_day_number + " I wanted to share with you. Check them out:<br><br>" +

         $event_panelists_full_formatted +

         $event_panel_highlight + "<br><br>" +
 
         "If you’re able to join us, you’ll get the chance to ask the speakers questions in real-time and to chat with the panelists and fellow attendees in smaller breakout rooms to discuss the event topics. We’ll also send all we’ll final attendees a gift card to use with your favorite meal delivery service. Your next coffee, pizza, or late-night snack is on us!<br><br>" +
 
         "Are you interested in attending, " + highlight_This("{{FIRST_NAME}}") + "?.<br><br>" +
  
         "Hope to see you there!<br><br>" +

         "SIGNATURE<br><br>"
         ,

      ];

      const $pr_drafts_pa_new_copy = 
      [
        // PAST ATTENDEE PANEL RECRUITMENT TEST - NEW COPY - JULY, 2021
        
        // PR MESSAGE 1.1

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab25" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab26" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab25">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, join us again?</p><br><br>
              
              Hey {{FIRST_NAME}},<br><br>
      
              ${highlight_This("Glad you were able to join us (past attendee)")} --or-- ${highlight_This("Thanks for speaking on our panel (past panelist)")} at ${highlight_This("{{SNIPPET 3-PAST_EVENT}}")} in ${highlight_This("{{SNIPPET 4-MONTH}}")} ${highlight_This("{{SNIPPET 5-YEAR}}")}. I hope you enjoyed the event as much as we did!<br><br>
      
              We’d love to have you participate as a panelist in our upcoming virtual discussion, ${$event_full_title}, on ${$event_long_date} from 11:45am – 1:15pm ${$event_timezone}. This time, our conversation will revolve around ${$event_panel_snippet}.<br><br>
      
              As a refresh on our format, we will have ${highlight_This("#")} or so ${$event_function_leaders} join for a panel discussion, bookended by two breakout room sessions for networking and small group conversations.<br><br>
      
              Lunch is on us in the form of a meal delivery code sent after the event, or attendees also have the option of donating their meal to charity.<br><br>

              You can find further details on the proposed discussion topics on our event website ${$event_website}.<br><br>

              May I confirm your interest and follow up with additional details?<br><br>

              Cheers,

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab26">
              
            <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 1.1 - NEW COPY</p>
            <p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, join us again?</p><br><br>
            
              Hey {{FIRST_NAME}},<br><br>
      
              ${highlight_This("Glad you were able to join us (past attendee)")} --or-- ${highlight_This("Thanks for speaking on our panel (past panelist)")} at ${highlight_This("{{SNIPPET 3-PAST_EVENT}}")} in ${highlight_This("{{SNIPPET 4-MONTH}}")} ${highlight_This("{{SNIPPET 5-YEAR}}")}. I hope you enjoyed the event as much as we did!<br><br>
      
              We’d love to have you participate as a panelist in our upcoming virtual discussion, ${$event_full_title}, on ${$event_long_date} from 11:45am – 1:15pm ${$event_timezone}. This time, our conversation will revolve around ${$event_panel_snippet}.<br><br>
      
              As a refresh on our format, we will have ${highlight_This("#")} or so ${$event_function_leaders} join for a panel discussion, bookended by two breakout room sessions for networking and small group conversations.<br><br>
      
              As a thank you for speaking, we'll send all final participants a $30 code to support the charity of your choice. Instead of providing our attendees with a free lunch, we’re hoping to do some good in the world by partnering with local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>

              You can find further details on the proposed discussion topics on our event website ${$event_website}.<br><br>

              May I confirm your interest and follow up with additional details?<br><br>

              Cheers,

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)
        
        "Hey again {{FIRST_NAME}},<br><br>" +

        "Just wanted to circle back on my panel invitation below and expand on the topics we’ll cover.<br><br>" +

        "At a high level, we are looking to explore the discussion points below, though these conversations tend to flow in the direction of attendees’ interests and the passions of our panel—we can dive into your expertise and preference in greater detail on our panel practice run:<br><br>" +

        discussionTopics() + "<br>" +

        "If these topics are of interest to you, but you are not interested in participating as a speaker, we would still love to have you join again as an attendee.<br><br>" +

        "Would you like to contribute to our panel discussion?<br><br>" +

        "Steve",

        // PR MESSAGE 1.3

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab27" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab28" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab27">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 1.3 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
      
              Hope your day is going well, {{FIRST_NAME}}. Just wanted to bring this invite to the top of your inbox.<br><br>
      
              The event should be a great opportunity for you to demonstrate your expertise as a ${$event_function} leader, and to share your experience with industry peers.<br><br>
      
              Happy to jump on a 5-minute call to further explain our objectives and to share more about the panel experience.<br><br>
      
              May we count you in?<br><br>

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab28">
              
              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 1.3 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${$event_month_number}/${$event_day_number} For a Charitable Cause</p><br><br>
      
              Hope your day is going well, {{FIRST_NAME}}. Just wanted to bring this invite to the top of your inbox.<br><br>
      
              The event should be a great opportunity for you to demonstrate your expertise as a ${$event_function} leader, and to share your experience with industry peers.<br><br>

              And don’t forget, we’ll send you a code to donate to the charity of your choice after the event!<br><br>
      
              Happy to jump on a 5-minute call to further explain our objectives and to share more about the panel experience.<br><br>
      
              May we count you in?<br><br>

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // PR MESSAGE 2.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 2.1 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Join us as an attendee on " + $event_month_number + "/" + $event_day_number + "?</p><br><br>" + //target_subject($event_target_copy)

        "Hey {{FIRST_NAME}}<br><br>" +

        "I sent you an invitation a few weeks ago to join the panel for our virtual event on " + highlight_This("{{INDUSTRY}}") + ", but now that our panel is full, I wanted to circle back and invite you to participate as an attendee.<br><br>" +

        "At " + $event_full_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", we’ll be chatting with a group of " + $event_audience + " about strategies they’ve developed for " + $event_panel_snippet + ".<br><br>" +

        "Our goal is for you to make connections with peers who are having the same, real life problems as you and to walk away with actionable takeaways you can share with your team.<br><br>" +

        "Can I count you in for " + $event_month_number + "/" + $event_day_number + "? You’re welcome to invite an interested coworker to the discussion as well.<br><br>" +

        "Happy {{SEND_DAY}}!<br><br>" +

        highlight_This("SIGNATURE"),

        // PR MESSAGE 2.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Panel Recruitment 2.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)

        "Hi again {{FIRST NAME}},<br><br>" +

         "Reaching out one final time about our " + $event_short_title + " event. We have a really phenomenal group of panelists speaking on "+ $event_month_number + "/" + $event_day_number + " I wanted to share with you. Check them out:<br><br>" +

         $event_panelists_full_formatted + "<br><br>" +

         $event_panel_highlight + "<br><br>" +
 
         "If you’re able to join us, you’ll get the chance to ask the speakers questions in real-time and to chat with the panelists and fellow attendees in smaller breakout rooms to discuss the event topics. We’ll also send all we’ll final attendees a gift card to use with your favorite meal delivery service. Your next coffee, pizza, or late-night snack is on us!<br><br>" +
 
         "Are you interested in attending, " + highlight_This("{{FIRST_NAME}}") + "?.<br><br>" +
  
         "Hope to see you there!<br><br>"
         ,

      ];

      const $rr_drafts_cold_new_copy = 
      [
        // COLD REGISTRANT RECRUITMENT TEST - NEW COPY - January, 2022
        
        // RR MESSAGE 1.1

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab1" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab2" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab1">

                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.1 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> Virtual Event on ${$event_month_number}/${$event_day_number} | Let’s Chat ${highlight_This("INDUSTRY")} on ${$event_month_number}/${$event_day_number} 🎉</p><br><br>

                Hey {{FIRST_NAME}},<br><br>

                <p class='open-personalization1'> <span class='personalization'> Select personalization strategy from dropdown (top-right) <i class='fa fa-external-link-alt'></i><span class='material-icons'></span></p>
                <span class='personalization1'></span><br>
        
                <i style='color:red;'>-or-</i><br>
                <i style='color:red;'>Personaliation 1</i><br><br>
        
                ${$event_customization_1} <br><br>
        
                <i style='color:red;'>-or-</i><br>
                <i style='color:red;'>Personaliation 2</i><br><br>
        
                ${$event_customization_2}<br><br>
                
                <i style='color:red;'>-or-</i><br><br>
        
                Hope you’re having a great week so far!<br><br>
        
                As the ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I’m curious to hear how much of your day-to-day revolves around ${$event_theme}?<br><br>
        
                I’m organizing an invite-only virtual thought leadership event, ${$event_full_title}, on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone} and would love for you to attend. We’ll gather with other ${$event_audience} to network and gain insights from our panel discussion on ${$event_panel_snippet}.<br><br>
                
                I know event fatigue is at an all-time high, and our goal is to make these events as interactive and valuable as possible. You’ll be able to ask the panelists questions in real-time, chat with peers in breakout rooms, and receive a meal delivery code following the event.<br><br>
        
                Can I send you more info on our ${$event_month_number}/${$event_day_number} event?<br><br>
        
                Cheers,<br>
                ${highlight_This("SIGNATURE")} <br><br>
        
                ${emailFooter()}

            </div>
            <!-- TAB 1 - END -->



            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab2">
              
                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.1 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> Virtual Event on ${$event_month_number}/${$event_day_number} | Let’s Chat ${highlight_This("INDUSTRY")} on ${$event_month_number}/${$event_day_number} 🎉</p><br><br>

                Hey {{FIRST_NAME}},<br><br>

                <p class='open-personalization1'> <span class='personalization'> Select personalization strategy from dropdown (top-right) <i class='fa fa-external-link-alt'></i><span class='material-icons'></span></p>
                <span class='personalization1'></span><br>
        
                <i style='color:red;'>-or-</i><br>
                <i style='color:red;'>Personaliation 1</i><br><br>
        
                ${$event_customization_1} <br><br>
        
                <i style='color:red;'>-or-</i><br>
                <i style='color:red;'>Personaliation 2</i><br><br>
        
                ${$event_customization_2}<br><br>
                
                <i style='color:red;'>-or-</i><br><br>
        
                Hope you’re having a great week so far!<br><br>
        
                As the ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I’m curious to hear how much of your day-to-day revolves around ${$event_theme}?<br><br>
        
                I’m organizing an invite-only virtual thought leadership event, ${$event_full_title}, on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone} and would love for you to attend. We’ll gather with other ${$event_audience} to network and gain insights from our panel discussion on ${$event_panel_snippet}.<br><br>
                
                As a thank you for speaking, we'll send all final participants a $30 code to support the charity of your choice. Instead of providing our attendees with a free lunch, we’re hoping to do some good in the world by partnering with local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>
        
                Can I send you more info on our ${$event_month_number}/${$event_day_number} event?<br><br>
        
                Cheers,<br>
                ${highlight_This("SIGNATURE")} <br><br>
        
                ${emailFooter()}

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)
        
        "Hi {{FIRST_NAME}},<br><br>" +

        "Following up with the event website for " + $event_short_title + ", where you can see the discussion topics and confirmed panelists: URL" + highlight_This($event_website) +  "<br><br>" +

        $event_customization_1 + "<br><br>" +

        "The above snippet is just an example of some of the industry trends we’re excited to dig into on the " + $event_day_number + "th.<br><br>" +

        "Does the content seem relevant to your role? Would love to reserve your spot if so!<br><br>" +

        "Have a great " + highlight_This("{{send day - " + getTodaysDate() + "}}") + "<br>" +
        highlight_This("SIGNATURE") + "<br><br>",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.3 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)

        "Hey again {{FIRST_NAME}},<br><br>" +

        "Hope you had a chance to check out our event site!<br><br>" +

        "One good thing that’s come out of the pandemic is our ability to connect with people across the country, regardless of physical location. At BDI, we love the flexibility and convenience of virtual events.<br><br>" +

        "We’re excited to gather experts from throughout " + highlight_This("{{the U.S. OR REGION}}") + " for " + $event_full_title + ". Take a look at our confirmed panel:<br>" +

        createPanelistList_full() +

        $event_panel_highlight + "<br><br>" +

        "Our panelists, along with the moderator from " + $event_client + ", will be in the breakout networking rooms along with attendees from " + highlight_This(createRegistrantCompaniesList()) + " to discuss " + $event_snippet + " with you.<br><br>" +

        "Are you interested in attending?<br><br>" +

        highlight_This("SIGNATURE"),

        // RR MESSAGE 1.4

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab3" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab4" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

              <!-- TAB 1 - START -->
              <div class="tab-pane active" id="tab3">

                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.4 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
        
                Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")} <br><br>
        
                Reaching out one final time re: our virtual ${$event_theme} event.<br><br>
        
                ${$event_customization_2} <br><br>
        
                Would love to hear your thoughts on the above research we reviewed when prepping for this event. It’s just a taste of what’s to come during our conversation! In addition to lively conversation and networking, I’m sure you’d love to order a delicious lunch on us. 😊 <br><br>
                        
                Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>
        
                ${highlight_This("SIGNATURE")}

              </div>
              <!-- TAB 1 - END -->



              <!-- TAB 2 - START -->
              <div class="tab-pane" id="tab4">
                
                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Cold Registrant Recruitment 1.4 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
        
                Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")} <br><br>
        
                Reaching out one final time re: our virtual ${$event_theme} event.<br><br>
        
                ${$event_customization_2} <br><br>
        
                Would love to hear your thoughts on the above research we reviewed when prepping for this event. It’s just a taste of what’s to come during our conversation. And don’t forget, we’ll send you a code to donate to the charity of your choice after the event!<br><br>
                        
                Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>
        
                ${highlight_This("SIGNATURE")}

              </div>
              <!-- TAB 2 - END -->

          </div>
        </div>
        `

      ];

      const $rr_drafts_optin_new_copy = 
      [
        // COLD REGISTRANT RECRUITMENT TEST - NEW COPY - JULY, 2021
        
        // RR MESSAGE 1.1

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab9" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab10" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab9">

                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.1 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, an event invite for you ✉️ | Virtual Event on ${$event_month_number}/${$event_day_number}</p><br><br>

                Hey {{FIRST_NAME}},<br><br>

                When I reached out to you about our thought leadership event ${highlight_This("PAST_EVENT")} in ${highlight_This("PAST_EVENT_MONTH")} ${highlight_This("PAST_EVENT_YEAR")}, you expressed interest in hearing about other ${highlight_This("INDUSTRY")} events.<br><br>
        
                I’d love to have you join our upcoming virtual event, ${$event_full_title}, as I’d guess a decent amount of your day-to-day at ${highlight_This("COMPANY")} revolves around ${$event_theme}.<br><br>
        
                This time, our invite-only chat about ${$event_snippet} is taking place on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone}. I’d love to have you join as an attendee where you can gather and network with other ${$event_audience}.<br><br>
        
                As the ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I’m curious to hear how much of your day-to-day revolves around ${$event_theme}?<br><br>
        
                I know event fatigue is at an all-time high, and we want to make these events a valuable addition to your calendar. As a reminder about our format, you’ll be able to ask the panelists questions in real-time, chat with peers in breakout rooms, and receive a $30 meal delivery code following the event.<br><br>
                
                Can I send you more info on our ${$event_month_number}/${$event_day_number}event?<br><br>
        
                Cheers,<br>
                ${highlight_This("SIGNATURE")}<br><br>
        
                ${emailFooter()},

            </div>
            <!-- TAB 1 - END -->



            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab10">
              
              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>

              Hey {{FIRST_NAME}},<br><br>

              When I reached out to you about our thought leadership event ${highlight_This("PAST_EVENT")} in ${highlight_This("PAST_EVENT_MONTH")} ${highlight_This("PAST_EVENT_YEAR")}, you expressed interest in hearing about other ${highlight_This("INDUSTRY")} events.<br><br>
      
              I’d love to have you join our upcoming virtual event, ${$event_full_title}, as I’d guess a decent amount of your day-to-day at ${highlight_This("COMPANY")} revolves around ${$event_theme}.<br><br>
      
              This time, our invite-only chat about ${$event_snippet} is taking place on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone}. I’d love to have you join as an attendee where you can gather and network with other ${$event_audience}.<br><br>
      
              As the ${highlight_This("TITLE")} at ${highlight_This("COMPANY")}, I’m curious to hear how much of your day-to-day revolves around ${$event_theme}?<br><br>
      
              As a thank you for speaking, we'll send all final participants a $30 code to support the charity of your choice. Instead of providing our attendees with a free lunch, we’re hoping to do some good in the world by partnering with local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>
              
              Can I send you more info on our ${$event_month_number}/${$event_day_number}event?<br><br>
      
              Cheers,<br>
              ${highlight_This("SIGNATURE")}<br><br>
      
              ${emailFooter()}

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)
        
        "Hi {{FIRST_NAME}},<br><br>" +

        "Following up to share the event website for " + $event_short_title + ", where you can see the discussion topics and confirmed panelists: " + highlight_This("URL") + " " + $event_website + "<br><br>" +

        $event_customization_1 + "<br><br>" +

        "Can’t wait to talk about top-of-mind trends like the above with our panelists and attendees on the " + $event_day_number + "th.<br><br>" +

        "Let me know if the content seems relevant to your role, and I’ll send you the Zoom link to join!<br><br>" +

        highlight_This("SIGNATURE") + "<br><br>",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Registrant Recruitment 1.3 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>" + //target_subject($event_target_copy)

        "Hi {{FIRST_NAME}},<br><br>" +

        "What did you think of our event site?<br><br>" +

        "We love the flexibility and convenience of virtual events — what better way to connect with peers across the country, regardless of physical location?<br><br>" +

        "We’re excited to gather experts from throughout " + highlight_This("{{the U.S. OR REGION}}") + " for " + $event_full_title + ". Including our confirmed panel here:<br>" +

        createPanelistList_full() +

        $event_panel_highlight + "<br><br>" +

        "Our panelists, along with the moderator from " + $event_client + ", will be in the breakout networking rooms along with attendees from " + highlight_This(createRegistrantCompaniesList()) + " to discuss " + $event_snippet + " with you.<br><br>" +

        "Let me know if I can RSVP you to the conversation!<br><br>" +

        highlight_This("SIGNATURE"),

        // RR MESSAGE 1.4

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab13" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab14" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab13">

               <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.4 - NEW COPY (without charity copy)</p>
               <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>

                Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")}

                Reaching out one final time re: our virtual ${$event_theme} event.<br><br>

                Would love to hear your thoughts on the above research we reviewed when prepping for this event. It’s just a taste of what’s to come during our conversation. In addition to valuable conversation and networking, I’m sure you’d love to order a delicious lunch on us. 😊<br><br>

                Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>

                ${highlight_This("SIGNATURE")}

            </div>
            <!-- TAB 1 - END -->



            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab14">
              

                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.4 - NEW COPY (with charity copy)</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
 
                 Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")}
 
                 Reaching out one final time re: our virtual ${$event_theme} event.<br><br>
 
                 Would love to hear your thoughts on the above research we reviewed when prepping for this event. It’s just a taste of what’s to come during our conversation. And don’t forget, we’ll send you a code to donate to the charity of your choice after the event!<br><br>
 
                 Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>
 
                 ${highlight_This("SIGNATURE")}

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

      ];

      const $rr_drafts_past_new_copy = 
      [
        // PAST ATTENDEE REGISTRANT RECRUITMENT TEST - NEW COPY - JULY, 2021
        
        // RR MESSAGE 1.1

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#ta11" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab12" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab11">

                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Registrant Recruitment 1.1 - NEW COPY</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, join us again? | {{FIRST_NAME}}, attend another event?</p><br><br>

                I was so happy to have you ${highlight_This("{{speak at our panel for}}")} <i style='color:red;'>or</i> ${highlight_This("{{join us at}}")} our thought leadership event ${highlight_This("PAST_EVENT")} in ${highlight_This("PAST_EVENT_MONTH")} ${highlight_This("PAST_EVENT_YEAR")}. I hope you got some valuable takeaways from the event!<br><br>

                I’d love to have you join us again at our upcoming virtual event, ${$event_full_title}. If I remember correctly, a decent amount of your day-to-day work at ${highlight_This("COMPANY")} revolves around ${$event_theme}.<br><br>
        
                This time, our invite-only chat about ${$event_snippet} is taking place on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone}. I’d love to have you join as an attendee where you’d have another opportunity to gather and network with other ${$event_audience} <br><br>
        
                I know event fatigue is at an all-time high, and we want to make these events a valuable addition to your calendar. As a reminder about our format, you’ll be able to ask the panelists questions in real-time, chat with peers in breakout rooms, and receive a $30 meal delivery code following the event.<br><br>
                
                Can I send you more info on our ${$event_month_number}/${$event_day_number }event?<br><br>
        
                Best,<br>
                ${highlight_This("SIGNATURE")}<br><br>

            </div>
            <!-- TAB 1 - END -->


            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab12">
              
              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.1 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> Attend on ${$event_month_number}/${$event_day_number} For a Charitable Cause</p><br><br>

              I was so happy to have you ${highlight_This("{{speak at our panel for}}")} <i style='color:red;'>or</i> ${highlight_This("{{join us at}}")} our thought leadership event ${highlight_This("PAST_EVENT")} in ${highlight_This("PAST_EVENT_MONTH")} ${highlight_This("PAST_EVENT_YEAR")}. I hope you got some valuable takeaways from the event!<br><br>

              I’d love to have you join us again at our upcoming virtual event, ${$event_full_title}. If I remember correctly, a decent amount of your day-to-day work at ${highlight_This("COMPANY")} revolves around ${$event_theme}.<br><br>
      
              This time, our invite-only chat about ${$event_snippet} is taking place on ${$event_long_date} from 12:00 - 1:15 PM ${$event_timezone}. I’d love to have you join as an attendee where you’d have another opportunity to gather and network with other ${$event_audience} <br><br>
      
              As a thank you for speaking, we'll send all final participants a $30 code to support the charity of your choice. Instead of providing our attendees with a free lunch, we’re hoping to do some good in the world by partnering with local and global causes like Habitat for Humanity, Feeding America, Cancer Research Institute, and Fisher House Foundation.<br><br>
              
              Can I send you more info on our ${$event_month_number}/${$event_day_number }event?<br><br>
      
              Best,<br>
              ${highlight_This("SIGNATURE")}<br><br>

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,


        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Registrant Recruitment 1.2 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>re:" + //target_subject($event_target_copy)
        
        "Hey again {{FIRST_NAME}},<br><br>" +

        "Hope you’re having a good week so far!<br><br>" +

        "Wanted to send you the event website for " + $event_short_title + ", where you can see the discussion topics and confirmed panelists: " + highlight_This("URL") + $event_website + "<br><br>" +

        $event_customization_1 + "<br><br>" +

        "Can’t wait to talk about top-of-mind trends like the above with our panelists and attendees on the " + $event_day_number + "th.<br><br>" +

        "Let me know if the content seems relevant to your role, and I’ll send you the Zoom link to join!<br><br>" +

        "Cheers,<br>" +
        highlight_This("SIGNATURE") + "<br><br>",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Registrant Recruitment 1.3 - NEW COPY</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>re:</p><br><br>" + //target_subject($event_target_copy)

        "Hi {{FIRST_NAME}},<br><br>" +

        "Did you have a chance to check out our event site?<br><br>" +

        "We think virtual events are the best way to connect with people across the country, regardless of physical location. We love the flexibility and convenience of the format, too!<br><br>" +

        "We’re excited to gather experts from throughout " + highlight_This("{{the U.S. OR REGION}}") + " for " + $event_full_title + ". Including our confirmed panel here:<br>" +

        createPanelistList_full() +

        $event_panel_highlight + "<br><br>" +

        "Our panelists, along with the moderator from " + $event_client + ", will be in the breakout networking rooms along with attendees from " + highlight_This(createRegistrantCompaniesList()) + " to discuss " + $event_snippet + " with you.<br><br>" +

        "Let me know if I can RSVP you to the conversation!<br><br>" +

        highlight_This("SIGNATURE"),

        // RR MESSAGE 1.4

        `
        <div class="tabbable">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab15" data-toggle="tab">Without Charity Copy</a></li>
            <li><a href="#tab16" data-toggle="tab">With Charity Copy</a></li>
          </ul>

          <div class="tab-content">

            <!-- TAB 1 - START -->
            <div class="tab-pane active" id="tab15">

              <p class='messagetypename'><i class='fa fa-paper-plane'></i> Past Attendee Registrant Recruitment 1.4 - NEW COPY</p>
              <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>

              ${highlight_This("{{FIRST_NAME}}")} Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")}

                Reaching out one last time to confirm your interest in our virtual ${$event_theme} event.<br><br>

                Would love to hear if there are any industry trends or topics you’d like us to include in the conversation on ${$event_month_number}/${$event_day_number}. We love shaping the conversation around attendee interest! In addition to valuable conversation and networking, I’m sure you’d love to order a delicious lunch on us.<br><br>

                Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>

                ${highlight_This("SIGNATURE")}

            </div>
            <!-- TAB 1 - END -->



            <!-- TAB 2 - START -->
            <div class="tab-pane" id="tab16">
              
                <p class='messagetypename'><i class='fa fa-paper-plane'></i> Opt-in Registrant Recruitment 1.4 - NEW COPY (with charity copy)</p>
                <p class='messagesubject'><i class='fa fa-envelope'></i> re:</p><br><br>
 
                ${highlight_This("{{FIRST_NAME}}")} Happy ${highlight_This("{{send day - " + getTodaysDate() + "}}")}
 
                 Reaching out one last time to confirm your interest in our virtual ${$event_theme} event.<br><br>
 
                 Would love to hear if there are any industry trends or topics you’d like us to include in the conversation on ${$event_month_number}/${$event_day_number}. We love shaping the conversation around attendee interest! In addition to valuable conversation and networking, I’m sure you’d love to order a delicious lunch on us.<br><br>
 
                 Can I count you in for ${$event_long_date}? Happy to have one of your colleagues tag along as well!<br><br>
 
                 ${highlight_This("SIGNATURE")}

            </div>
            <!-- TAB 2 - END -->

          </div>
        </div>
        `,

      ];

      const $rc_drafts = 
      [
        // NO SHOW MESSAGE | SORRY WE MISSED YOU [0]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Cancellations/No-Shows</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Here's What You Missed</p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Sorry we missed you at yesterday's <b>" + $event_short_title + "</b> virtual meeting!<br><br>" +

        "Special thanks to " + $event_client + " for making the event possible, and the following panelists for leading an exceptional discussion:<br>" +
        
        createPanelistList_full() +

        "We had an insightful conversation on " + $event_snippet + " with great participation from our attendees.<br><br>" +

        "We understand things come up and we’d still love to have you participate in future events!<br><br>" +

        "Are you open to keeping in touch?<br><br>" +

        "Thank you,<br>" +

        "<b>The Teams at BDI & " + $event_client + "</b>",
        

        // THANK YOU MESSAGE [1]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Thank You for Attending</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Thank You For Attending</p><br><br>" +
        
        "Hi FIRST NAME,<br><br>" +

        "Thank you so much for participating in the " + $event_short_title + " virtual meeting on " + highlight_This("DAY/yesterday") + "! We hope you found the discussion valuable.<br><br>" +

        "Please use this link to access your Hoppier gift card so that you can donate to the charity of your choice, courtesy of " + $event_client + "! <b>To redeem your card, please make sure you sign in with THIS email address.</b><br><br>" +

        "Once you log into Hoppier, you’ll have the option of using your $30 code to donate to charities including Habitat for Humanity and Fisher House Foundation, or you can opt to order lunch instead. Please note that the gift card balance is redeemable through 30 DAYS FROM NOW.<br><br>" +

        "Special thanks to " + $event_client + " for making the event possible, and to our moderator, " + $event_moderator_first_name + ", and to " + $event_panelists_first_name + " for leading the exceptional discussion.<br><br>"+

        "We'd love to hear your thoughts on your experience. Would you mind answering " + eventSurvey($event_survey) +

        "If you’re interested in continuing your conversation with " + $event_client + ", please contact <span style='background-color:yellow;text-transform:uppercase;'>POINT OF CONTACT @ EMAIL.</span><br><br>" +

        "Thank you. We hope to see you at a future event!<br><br>" +

        "<b>The Teams at BDI & " + $event_client + "</b>",

        // RSVP YES - CONFIRMED [2]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - RSVP YES - Confirmed</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <i>RE: Thread</i></p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Delighted to have you join us on " + $event_weekday + ", " + $event_date_month_and_number  + "<br><br>" +

        "Here is the meeting link: "+ $event_zoom_link +"<br><br>" +

        `The agenda for the session is simple:<br>
        <ul style="padding-left:0;">
        ${ dynamic_attendee_Agenda() }
        </ul><br>`
        +

        "Final attendees will receive their Hoppier gift card after the event as a thank you for attending, so check your inbox for your code the day after the event. On Hoppier, you’ll be able to choose to order lunch from a variety of food delivery apps or to donate the money to Food Bank for New York City or Give India for COVID relief.<br><br>" +

        "Please make sure to add etzler.steven@bdionline.com to your safe sender list to ensure the code isn't sent to spam. Looking forward to your participation!<br><br>" +

        "Steve",
        

        // RSVP YES - TENTATIVE [3]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - RSVP YES - Tentative/Interested</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <i>RE: Thread</i></p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Thanks for your response and interest in our event!<br><br>" +
        
        "We will put you down as a tentative registrant for now, and will send you a calendar invite as a placeholder. To learn more about the discussion topics and our panel, check out the event website: " + highlight_This($event_website) + "<br><br>" +
                        
        "You can also view who we have confirmed so far on this link.<br><br>" + 

        `Here is the agenda for the session:<br>
        <ul>
        ${ dynamic_attendee_Agenda() }
        </ul>
        `
        +

        "Look forward to confirming your participation!<br><br>" +

        `Steve`,

        // FINAL CONFIRMATIONS / PER MY VOICEMAIL [4]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Final Confirmation </p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Ready for tomorrow’s" + $event_short_title + " discussion?</p><br><br>" +

        "Hi FIRSTNAME,<br><br>" +

        "We’re looking forward to our interactive virtual roundtable tomorrow at " + $event_short_title + " from " + $event_start_time + " " + $event_timezone + "!<br><br>" + 

        "We have a great panel lined up to talk about " + $event_snippet + ". I hope you’re as excited as we are to learn from them and to share your own thoughts on the future of " + $event_theme + ".<br><br>" +

        "<b>Add event link to calendar:</b> "+ $event_virtual_link +"<br><br>"+

        "Tomorrow’s event will feature networking in small breakout rooms, Q&A following the panel discussion, and live attendee polling to kick off the event. Our goal is to give every attendee the opportunity to have their voice heard. If you’re comfortable, please be prepared to have your video and microphone on.<br><br>" +

        "All final attendees will receive an email the day following the event allowing you to redeem your charity donation code via Hoppier, or you can choose to order lunch if you prefer.<br><br>" + 

        `Here is the agenda for the session:<br>
        <ul>
        ${ final_confirmation_agenda() }
        </ul><br>

        <i>If you're no longer able to make it tomorrow, please reply directly to this email and let us know, as we are holding your virtual spot.</i><br><br>

        Thank you, and we look forward to seeing you tomorrow!<br><br>

        Best regards,<br>
        Steve Etzler<br>
        Business Development Institute`,

        // SEE YOU TODAY (Virtual, Hoppier) [5]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - See you today (Virtual, Hoppier)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you in a few!</p><br><br>" +

         "Hi " + highlight_This("NAME") + ",<br><br>" +

         "We’re so excited for today’s <b>" + $event_short_title + "</b> event at <b>{" + $event_time_display + "}</b> <b>" + $event_timezone + "</b>, and we hope that you are, too!<br><br>" +

         "We encourage all of our attendees to interact with each other and engage with the event content as much as you feel comfortable. We hope you’ll come out of today’s event with valuable insights and new connections with fellow <b>" + $event_audience + "</b> thought leaders.<br><br>" +

         "After the event, final attendees will receive a Hoppier gift card as a thank you for attending. <b>Please note that you must log into Hoppier with this {EMAIL} for access</b>. Keep your eye on your inbox the day after the panel for lunch on us!<br><br>" +

         "To join the meeting, please click here: " + highlight_This($event_virtual_link) +"<br><br>"+
         
         "See you soon,<br>" +
         "<b>Steve Etzler</b><br>" +
         "<b>Business Development Institute</b><br>",
         

        // ONBOARDING PANELIST - CONFIRMED [6]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Onboarding Panelist - Confirmed</p>" +

         "Hi " + highlight_This("NAME") + ",<br><br>" +

         "Great news—delighted to have you join us!<br><br>" +

         "The only thing I need from you is a headshot so we can add you to the event website " + highlight_This($event_website) + ". Happy to grab the one you have on LinkedIn if that’s okay.<br><br>" +
 
         "My colleague, " + highlight_This("AM NAME") + ", (CCed above) will circle back in a few weeks to lock in a 30-minute video call to prepare for the panel. I’ll introduce you to your moderator and fellow panelists then.<br><br>" +
         
         "Please note that we record our virtual events and by participating, you are agreeing to have the recording used for video content creation.<br><br>" +

         "Our goal in creating content is to share the takeaways from the event with those who are unable to participate and with attendees who wish to revisit the discussion. We do provide a disclaimer that all views and opinions are those of individuals and not of their employers.<br><br>" +
   
         "Do let us know if this is an issue for you. If not, kindly fill out this brief consent form: " + highlight_This("[LINK from RSVP Base]") + ".<br><br>" +
        
         "Lastly, please expect a calendar invite shortly.Thank you again, " + highlight_This("{{FIRST_NAME}}") + ". Please do not hesitate to reach out if you have any questions in the meantime!<br><br>" +
        
         "Best,<br>",

        // ONBOARDING PANELIST - TENTATIVE [7]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Onboarding Panelist - Tentative</p>" +

        "Hi NAME,<br><br>" +

        "Thanks for your quick reply and interest! I’d be delighted to have you join us.<br><br>" +
        
        "For more context about the program's objectives, content, discussion topics and sponsor, you can check out the event website: " + highlight_This($event_website) + "<br><br>" +
        
        "The virtual panel will be a simple interactive discussion. As a panelist, you’ll simply be featured on the website. Please note that the virtual meeting will be recorded and by participating in this event you are agreeing to have this recording used. Do let us know if this is an issue for you.<br><br>" +
        
        "So far, we have received interest from the following speakers:<br>" +
        
        createPanelistList_full() +
        
        "The only ‘preparation’ needed is one 30-minute planning call (about 1 week before the event) to share more details on event logistics, and to allow the panelists to speak about their areas of interest so we can all collaborate on the topics being discussed.<br><br>" +
        
        "May we count you in?<br><br>" +
        
        "Thank you, looking forward to hearing from you!<br><br>" +
        
        "Steve",
        

        // SCHEDULING PANEL PREP CALL (75 min) [8]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Scheduling Panel Prep Call (75 min)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Scheduling Panel Prep | "+ $event_short_title +"</p><br><br>" +

        "Hello all,<br><br>" +

        "We’re excited for your panel participation at " + $event_short_title + " virtual meeting, taking place on " + $event_long_date + " from 12:45PM - 2:15PM on our virtual event platform.<br><br>" +

        "We would like to schedule a 30 minute panel practice run and to get everyone's availability, we kindly ask you to fill out this form: https://airtable.com/shrJaDgJjLAQsYlcp " + highlight_This("LINK TO FORM ON RSVP SHEET") + ".<br><br>"+

        "As soon as I hear back from everyone, I’ll respond with a calendar invite for the time that works best across the board.<br><br>"+

        "Thank you!<br>"+
        isBlank($event_account_manager),

        // SCHEDULING PANEL PREP CALL (90 min) [9]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Scheduling Panel Prep Call (90 min)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Scheduling Panel Prep | "+ $event_short_title +"</p><br><br>" +

        "Hello all,<br><br>" +

        "We’re excited for your panel participation at " + $event_short_title + " virtual meeting, taking place on " + $event_long_date + " from  12:45PM - 2:30PM on our virtual event platform.<br><br>" +

        "We would like to schedule a 30 minute panel practice run and to get everyone's availability, we kindly ask you to fill out this form: https://airtable.com/shrJaDgJjLAQsYlcp " + highlight_This("LINK TO FORM ON RSVP SHEET") + ".<br><br>"+

        "As soon as I hear back from everyone, I’ll respond with a calendar invite for the time that works best across the board.<br><br>"+

        "Thank you!<br>"+
        isBlank($event_account_manager),

        // PANEL PREP AGENDA (Calendar Invite for Panel Prep Call) [10]
        

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Calendar Invite for Panel Prep Call (75 min)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>" + $event_short_title + " | Panel Prep</p><br><br>" +
 
        "Hi all,<br><br>"+

        "Looking forward to our panel prep call on "+ highlight_This("DAY, DATE at TIME")+". To join the video meeting, please click here: "+ highlight_This("AM ZOOM")+".<br><br>" +

        "If you haven’t already filled it out, please sign our recording consent form " + highlight_This("linked here") + ".<br><br>" +

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
        "<li>Event Website: " + "<a href='" + $event_website + "'>LINK</a></li>" +
        "<li>Live Registration List: " + "<a href='" + $event_promo_reg_list + "'>LINK</a></li>" +

        "<b>AGENDA</b><br><ul>" +
        dynamic_client_Agenda() +
        "</ul><br><br>" +

        "<b>PANEL DISCUSSION QUESTIONS</b><br>" +
        discussionTopics() + "<br>" +

        "<b>THANK YOU</b><br>" +
        "We will send you a $30 meal delivery code after the event—stay tuned for that email from Steve Etzler! You'll have the option to donate your meal if you prefer.",

        // ONE WEEK REMNINDER [11]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> One Week Reminder (Confirmed)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> " + $event_weekday + " is going to be your favorite day next week</p><br><br>" +

        "Hi NAME,<br><br>"+

        "We hope you’re excited about next week’s "+ $event_full_title +" virtual lunch & learn!<br><br>"+

        "We’ve got a panel of experts that have agreed to be grilled on their thoughts and best practices around " + $event_theme + ". You’ll be able to interact with our panel and share your thoughts with our impressive list of registrants from brands including " + $event_panelists_companies + ".<br><br>"+

        "If you have a colleague who might also find the event valuable, feel free to share this invite with them. We can’t wait to hear different perspectives on " + $event_panel_snippet + ".<br><br>" + 

        "<b>Add event link to calendar: </b>"+ $event_virtual_link +"<br><br>"+

        "After the event, we'll send your charity donation code in our thank you email. To ensure you're able to receive your code, please make sure to add our etzler.steven@bdionline.com email to your safe senders list so the message doesn't end up in your spam folder.<br><br>"+

        "Thank you. We look forward to seeing you at " + highlight_This("12pm") + " on " + $event_long_date + ".<br><br>" + 

        "Best regards,<br>" +
        "<b>Steve Etzler</b><br>"+
        "<br>Business Development Institute</br><br>",

        // RSVP NO - Virtual [12]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> RSVP NO - Response</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i>  We’ve Gone Virtual!</p><br><br>" +

         "Hi NAME,<br><br>" +

         "You let me know a while back that you wouldn’t be able to join us at "+ $event_venue +" in " + $event_city +" for "+ $event_full_title + " on "+ $event_long_date +". At this time, due to current Coronavirus concerns, we’ve decided to take the entire event virtual!<br><br>"+
 
         "Instead of going from 12 – 2pm at the restaurant, we’ll go from 12 – 1:15pm online—the agenda will still include an interactive panel discussion, breakout session networking with your local peers, and we’ll be sending meal delivery codes to all the attendees—so lunch is still on us!<br><br>"+
 
         "Please check out the event website "+ highlight_This($event_website) +" and let me know if you’re able to join us—we’d love to have you, and I’m happy to save you a spot.<br><br>"+
 
         "Hope you’re staying healthy,<br><br>"+
  
         "Steve Etzler<br>" +
         "<b>Business Development Institute</b>",

        // CONFIRMATION CALLS SCRIPT [13]

        "<p class='messagetypename'><i class='fa fa-phone'></i> Confirmation Calls Script</p><br>" +

        "Hi <span style='color:red;'>{NAME}</span>,<br><br>"+

        "This is <span style='color:red;'>{VA}</span> calling from BDI.<br><br>"+

        "We have you registered to join us at "+ $event_full_title +" tomorrow, "+ $event_long_date + " from " + $event_start_time + " " + $event_timezone + ".<br><br>" +

        "Please be prepared to participate via video on your computer or mobile device. We'll be providing a code for food delivery!<br><br>" +

        "If your schedule has changed and you can no longer attend, please let us know by responding to Steve's email.<br><br>" +

        "Thank you! Bye!<br><br>",

        // Event Live Now Follow Up [14]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Event Live Now Follow Up</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> Event Live Now Follow Up</p><br><br>" +

        "Hi <span style='color:red;'>{NAME}</span>,<br><br>"+

        "Just wanted to let you know that the " + $event_short_title + " event is in progress. The conversation is top-notch, and we'd love to have you join!<br><br>"+

        "Please click here to join: ZOOM LINK. " + highlight_This($event_zoom_link) + "<br><br>" +

        "Warm regards,<br>Steve<br>",

        // ENGAGED FOLLOW UP [15]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Engaged Follow Up</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> We missed your participation!</p><br><br>" +

        "Hi <span style='color:red;'>{NAME}</span>,<br><br>"+

        "I never heard back from you on " + highlight_This("yesterday's/DAY's") + " " + $event_short_title + " virtual meeting, but I wanted to let you know we had a great conversation. I understand things come up and would still love to have you participate in any future events that interest you.<br><br>"+

        "In case you still want to catch the discussion, we have a recording of the panel here " + highlight_This("PANEL RECORDING LINKED") + ".<br><br>" +

        "Are you open to keeping in touch?<br><br>" +

        "Thank you,<br>Steve<br>",

        // ONE WEEK REMNINDER (w/out registration list) [16]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> One Week Reminder (Confirmed)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> " + $event_weekday + " is going to be your favorite day next week</p><br><br>" +

        "Hi NAME,<br><br>"+

        "We hope you’re excited about next week’s "+ $event_full_title +" virtual lunch & learn!<br><br>"+

        "We’ve got a panel of experts that have agreed to be grilled on their thoughts and best practices around " + $event_theme + ". You’ll be able to interact with our panel and share your thoughts with our impressive list of registrants from brands including " + $event_panelists_companies + ".<br><br>"+

        "If you have a colleague who might also find the event valuable, feel free to share this invite with them. We can’t wait to hear different perspectives on " + $event_panel_snippet + ".<br><br>" + 

        "<b>Add event link to calendar: </b>"+ $event_virtual_link +"<br><br>"+

        "After the event, we'll send your charity donation code in our thank you email. To ensure you're able to receive your code, please make sure to add our etzler.steven@bdionline.com email to your safe senders list so the message doesn't end up in your spam folder.<br><br>"+

        "Thank you. We look forward to seeing you at " + highlight_This("12pm") + " on " + $event_long_date + ".<br><br>" + 

        "Best regards,<br>" +
        "<b>Steve Etzler</b><br>"+
        "<br>Business Development Institute</br><br>",

        // HERE'S WHAT YOU MISSED [17]

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Here's What You Missed</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Here's What You Missed</p><br><br>" +

        "Hi NAME,<br><br>"+

        "Sorry we missed you at our " + $event_full_title + " virtual meeting on " + $event_long_date + "! <br><br>"+

        "I wanted to share a " + $event_website + " to the digital assets our content team pulled together after the discussion. I thought the " + highlight_This("YOUTUBE TITLE") + " clip in particular had some really actionable takeaways.<br><br>"+

        "Special thanks to " + $event_client + "for making the event possible, and the following speakers for leading an exceptional panel discussion:<br><br>" + 

        createPanelistList_full() + "<br>" + 

        "Though you weren’t able to attend the event live, I hope you’re able to get a taste of the insightful conversation we had on " + $event_panel_snippet + ".<br><br>"+

        "We’d love to have you participate in future events if you’re interested. Are you open to keeping in touch?<br><br>"+

        "Thank you,<br>" +
        "<b>The Teams at BDI & " + $event_client + "</b>",

      ];

      const $cc_drafts = 
      [
        // EVENT PREP DETAILS

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Event Prep Details - Client Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i>  Event Prep for Virtual "+ $event_short_title + " | " + target_subject() + "</p><br><br>" +

        "Hi all,<br><br>" +

        "We are excited for our virtual "+ $event_short_title +" event, taking place tomorrow, "+ $event_long_date +". See below for additional details.<br><br>" +

        "Thanks,<br><br>" +

        isBlank($event_account_manager) + "<br>" +

        "<b>EVENT DETAILS</b>" +
        `<ul>
        <li>Program: `+ $event_full_title +`</li>
        <li>Date: `+ $event_long_date +`</li>
        <li>Event Website: `+ highlight_This($event_website) +`</li>
        <li>Registration List: `+ highlight_This($event_promo_reg_list) +`</li>
        </ul><br>`+

        "<b>PANELISTS</b>" +
        createPanelistList_full() + "<br>" +

        "<b>MODERATOR</b>" +
        "<ul><li>"+$event_moderator_full_formatted+"</li></ul><br>"+

        "<b>VIRTUAL EVENT FLOW</b>" +
        `<ul>
          ${ dynamic_virtual_event_flow() }
        </ul><br><br>`,

        // CLIENT PANEL RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Panel Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Join Our Virtual "+ target_subject($event_target_copy) +" Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        $event_client + " is organizing an upcoming thought-leadership event on " + $event_theme + " and I’m reaching out to invite you to join us as a <b>panelist</b>—I think you’d be a great addition to the conversation.<br><br>" +

        $event_full_title + "<br>" +
        "<b>Day: </b>" + $event_long_date + " from 12:00 pm to 1:15 pm " + $event_timezone + "<br>" +
        "<b>Website: </b>" + $event_website + "<br><br>" +

        "We’ll gather a group of 30 or so " + $event_audience + " for an interactive panel discussion revolving around " + $event_snippet + ". We’ve drafted a few discussion topics (see below), but as this doesn’t include any formal script or presentations, these conversations tend to flow in the direction of attendees’ interests and panelists’ passions.<br>" +

        discussionTopics() +

        "Being a panelist is a great way to network and ‘talk shop’ with peers across the country, strengthen your personal brand, and it’s a casual commitment—we only ask for 30 minutes for a practice run prior to the event and attendance from 11:45 am to 1:15 pm day-of.<br><br>" +

        "We’ll also be providing a $30 meal delivery code to all speakers and attendees.<br><br>" +

        "Do you want to hear more about speaking on our virtual panel, {{FIRST_NAME}}?<br><br>",


        // CLIENT REGISTRANT RECRUITMENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Client Recruitment - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Join Us For Lunch? </p><br><br>" +

        "Hello {{FIRST_NAME}},<br><br>" +

        "We’re hosting a virtual thought leadership event on " + $event_theme + ", and we’d love to see you there. Are you free for lunch on " + $event_long_date + "?<br><br>" +

        $event_full_title + " will focus on peer-to-peer networking for a group of " + $event_audience + " from " + target_2_1_area($event_target_copy) + "<br><br>" +
        
        "Here’s what you need to know:<br>" + 

        `<ul>
        <li>` + $event_full_title + `</li>
        <li>Date: ` + $event_long_date + `</li>
        <li>Time: ` + $event_time_display + " " + $event_timezone + `</li>
        <li>Details: Event Site ` + highlight_This($event_website) + `</li>
        </ul>` +
        
        "The event agenda includes a moderated panel discussion about " + $event_snippet + ", audience Q&A, and video networking in small breakout rooms.<br><br>" +
        
        "Our panel includes the following leaders:<br>" +

        createPanelistList_full() +
        
        "As an attendee, you’ll have the chance to hear the panel share their insights, learn from others in your field, and network with your peers. Final attendees can also enjoy lunch on us with a $30 meal delivery code.<br><br>"+
        
        `Interested in joining us, {{FIRST_NAME}}? Please use the form on the event site to RSVP today.<br><br>` +

        "Best<br><br>",

        // FINAL ATTENDEE LIST FOR CLIENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Final Attendee List For Client - Client Registrant Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Final Attendees & Recording | " + $event_short_title + " | " + $event_month_number + "/" + $event_day_number + "</p><br><br>" +

        "Hi all,<br><br>" +

        "Hope you enjoyed today’s event!<br><br>" +
        
        "<b>FINAL ATTENDEES</b><br>" +
        "Please <u>see here</u> " + highlight_This($event_promo_reg_list) + " for the final attendee list.<br>" +
        "I am also attaching this as a CSV.<br><br>" +

        "<b>WARM LEADS</b><br>" +
        "Here is a <u>link</u> " + highlight_This($event_client_rsvp_list) + " to the cancellations, no-shows, or RSVP NO contacts which can be fantastic follow-up opportunities for your team.<br>" +
        "I am also attaching this as a CSV.<br><br>" +

        "<b>INVITE LIST</b><br>" +
        "Here is a <u>link</u> " + highlight_This($event_client_rsvp_list) + " to the complete invite list.<br>" +
        "I am also attaching this as a CSV.<br><br>" +

        "<b>RECORDING – <i>" + highlight_This("OPTIONAL FOR MAX CLIENTS") + "</i></b><br>" +
        "Here is the <u>link</u> to the recording for INTERNAL USE ONLY.<br><br>" + 

        "If you want to use the recordings for external purposes, please contact us regarding the panelist consent approvals that are required.<br><br>" +

        "<b>SLIDO SURVEY RESULTS</b><br>" +
        "Attaching this as a CSV.<br><br>" + 
      
        "<b>POST EVENT COMMUNICATION - <i>" + highlight_This("ONLY IF NOT RECEIVED PRIOR") + "</i></b><br>" +
        "Please let us know if we should include any links/collateral in the post-event communication emails (thank you for attending & sorry we missed you). We will share the post-event survey results with you once we have them <b><i>(OPTIONAL)</i></b>.<br><br>" +

        "Thanks – have a great day!<br><br>",

        // Calendar Invite to Sales Team + AGENDA

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Calendar Invite: Panel Prep Call (AGENDA) - Client Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> " + $event_short_title + " Panel Prep</p><br><br>" +
        
        "Hi all,<br><br>" +  
        
        "Looking forward to our panel prep call on " + highlight_This("DAY") + "," + highlight_This("DATE") + " at " + highlight_This("TIME") + "" + ". To join the video meeting, please click here: " + highlight_This("AM Zoom") + ".<br><br>" +
        
        "If you haven’t already filled it out, please sign our recording consent form linked " + highlight_This("here") + ". <br><br>" +

        "Kindly see the agenda and event details below.<br><br>" +

        "Thank you,<br><br>" +
        $event_account_manager + "<br>" +

        "<b>INTRODUCTIONS</b><br><br>" +

        "<div class='list-indent'>" +

          "Panelists" +
          createPanelistList_full() + "<br>" +

          "Moderator" +
          "<ul><li>"+$event_moderator_full_formatted+"</li></ul><br>" +

          "<br><b>EVENT DETAILS</b></br>" +
            `<ul>
              <li>Program: `+ $event_full_title +`</li>
              <li>Date: `+ $event_long_date +`</li>
              <li>Event Website: `+ highlight_This($event_website) +`</li>
              <li>Live Registration List: `+ highlight_This($event_promo_reg_list) +`</li>
            </ul><br>` +

          "<b>AGENDA</b><br><ul>" +
          agenda_for_calendar_invite() + 
          "</ul><br><br>" +

          "<b>PANEL DISCUSSION QUESTIONS</b><br><ul>" +
          discussionTopics() + 
          "</ul><br><br>" +

          "<b>THANK YOU</b><br><ul>" +
          "We will send you a $30 meal delivery code after the event—stay tuned for that email from Steve Etzler! You'll have the option to donate your meal if you prefer." + 
          "</ul><br><br>" +
          
        "</div>",

        // Calendar Invite to Sales Team + EVENT

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Calendar Invite: Panel Prep Call (EVENT) - Client Communication</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> " + $event_short_title + " Virtual Panel Event</p><br><br>" +
        
        "Hi all,<br><br>" +  
        
        "Looking forward to connecting at " +  $event_start_time + " " + $event_timezone + ".<br><br>" +
        
        "We’ll meet here: " + highlight_This($event_zoom_link) + " <br><br>" +

        "<div class='list-indent'>" +

        "<br><b>EVENT DETAILS</b></br>" +
            "<ul style='list-style:none;'>" +
             "<li>" + $event_full_title + "</li>" +
             "<li>Date:" + $event_long_date + " " + $event_timezone + "</li>" +
             "<li>Location:" + $event_zoom_link + "</li>" +
            "</ul><br>" +

          "<b>EVENT ATTENDANCE</b><br><ul style='list-style:none;'>" +
          "<li>Panelists are on the Event Website: " + $event_website + "</li>" +
          "<li>Live Registration List: " + highlight_This($event_promo_reg_list) + "</li>" +
          "</ul><br>" +

          "<b>AGENDA & YOUR ROLE</b><br><ul style='list-style:none;'>" +
            "<li><b>12:00PM:</b> Attendees will be let in, some welcome and housekeeping remarks.</li><br>" +
            "<li><b>12:05PM:</b> We’ll move to breakout rooms for interactive discussion between small groups (6-10 people each). You’ll be assigned to the same room as those prospects or customers that you requested. <i>Please consider yourself responsible for the breakout conversation, and facilitate introductions all around, as well as some light conversation on what attendees are hoping to hear from the panel</i>.</li><br>" +
            "<li><b>12:15PM:</b> We’ll come back together for the moderated panel discussion.</li><br>" +
            "<li><b>1:10PM:</b> The moderated discussion will wrap up, and we’ll head back to those smaller groups again. <i>Again, please facilitate a group discussion on the topics that the panel discussed, involving every attendee as much as possible. This is a great opportunity to get notes on the challenges each attendee is facing for personal follow up later on</i>.</li><br>" +
            "<li><b>1:30pm:</b> Event officially ends.</li>" +
          "</ul><br><br>" +
          
        "</div>",
    
      ];

      const $pr_personalized_drafts = 

      [
        // PANEL RECRUITMENT PERSONALIZED

        // Recommendation

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Recommendation</b> - They’ve got a rec from someone that talks about skills relevant to the event/topic</p><br><br>" +

        "<div class='editor_rrp2'>" +
        "I came across your LinkedIn looking for " + highlight_This("PROSPECT_GENERAL_TITLEs") + ", and I saw " + highlight_This("RECOMMEDER_NAME’s") + " recommendation — " + highlight_This("HE_SHE_THEY") + " mentioned you " + highlight_This("RECOMMENDATION_INDIRECT_QUOTE") + ", and it caught my eye. That’s the sort of leader that I look for as I build panels." +
        "</div>",

        // Endorsed Skills

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Endorsed Skills</b> - They’ve got upwards of 20 endorsements for a <b>RELEVANT</b> (to the event) skill or two</p><br><br>" +

        "<div class='editor_rrp4'>" +
        "I see you’ve got " + highlight_This("#") + " endorsements on LinkedIn for your " + highlight_This("SKILL_TYPE") + " skills and " + highlight_This("#") + " for " + highlight_This("SKILL_TYPE2") + ". Your profile definitely caught my attention as I was looking for experienced " + highlight_This("INDUSTRY") + " leaders." +
        "</div>",

        // About

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>‘About’</b> - They’ve got relevant experience or skills listed in the section they wrote about themselves</p><br><br>" +

        "<div class='editor_rrp5'>" +
        "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + ", and I saw you mention in your ‘about’ section that you " + highlight_This("ABOUT_QUOTE") + ". Definitely caught my eye!" + 
        "</div>",

        // Certifications

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Certifications</b> - They’ve got a RELEVANT (to the event) certification that they’ve completed</p><br><br>" +

        "<div class='editor_rrp6'>" +
        "I came across your LinkedIn profile looking for leaders in " + highlight_This("INDUSTRY") + ", and I saw you’re certified " + highlight_This("INDUSTRY") + " from " + highlight_This("CERTIFICATION_SOURCE") + "—definitely caught my attention." +
        "</div>",

        // Interests

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Interests</b> - They’re following a person/company/group that is interesting or out of the norm (ideally relevant to the event)</p><br><br>" +

        "<div class='editor_rrp7'>" +
        "I saw on your LinkedIn that one of your interests is " + highlight_This("INTEREST") + " — I thought " + highlight_This("HIS_HER_THEIR") + " recent " + highlight_This("ARTICLE_VIDEO_POST") + " on " + highlight_This("TOPIC") + " was really interesting." +
        "</div>",

        // No useful info

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>No Useful Info</b> - If there is NOTHING on their profile but title and company</p><br><br>" +

        "<div class='editor_rrp19'>" +
        "I saw on LinkedIn that you’re the " + highlight_This("TITLE") + " at " + highlight_This("COMPANY") + ". I thought about reaching out to you on LinkedIn, but I wasn’t sure if you’re very active there — figured shooting you a quick email would be better." + 
        "</div>",
        
        // Promotion

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Promotion</b></p><br><br>" +

        "<div class='editor_rrp_promotion1'>" +
        "Noticed on your LinkedIn that you’ve recently been promoted to " + highlight_This("NEW TITLE") + " at " + highlight_This("COMPANY") + ". Congratulations!" +
        "</div>",

        // College Alumni

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>College Alumni</b></p><br><br>" +

        "<div class='editor_rrp_college1'>" +
        "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + " and saw that you’re an alumnus of " + highlight_This("UNIVERSITY") + ". I thought their recent " + highlight_This("ARTICLE VIDEO POST") + " on " + highlight_This("TOPIC") + " was a great one." +
        "</div>",

        // Current Responsibilities

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Current Responsibilities</b></p><br><br>" +

        "<div class='editor_rrp_responsibilites1'>" +
        "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + " and I noticed that you’re responsible for " + highlight_This("CURRENT_RESPONSIBILITIES") + " in your current role—definitely caught my attention." +
        "</div>",

        // Company News/Update

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Company News/Update</b></p><br><br>" +

        "<div class='editor_rrp_companyNews1'>" +
        "I saw on LinkedIn that you’re the " + highlight_This("TITLE") + " at " + highlight_This("COMPANY") + ". I saw on " + highlight_This("COMPANY") +"’s LinkedIn that you recently " + highlight_This("NEWS") + "—seems like an exciting time to be there." +
        "</div>"

      ]

      const $rr_personalized_drafts = 

      [
        // REGISTRANT RECRUITMENT PERSONALIZED

        // Recommendation

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Recommendation</b> - They’ve got a rec from someone that talks about skills relevant to the event/topic</p><br><br>" +

        "<div class='editor_rrp9'>" +
        "I came across your LinkedIn looking for " + highlight_This("PROSPECT_GENERAL_TITLEs") + ", and I saw " + highlight_This("RECOMMEDER_NAME’s") + " recommendation — " + highlight_This("HE_SHE_THEY") + " mentioned you " + highlight_This("RECOMMENDATION_INDIRECT_QUOTE") + ", and it caught my eye." +
        "</div>",

        // Endorsed Skills

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Endorsed Skills</b> - They’ve got upwards of 20 endorsements for a <b>RELEVANT</b> (to the event) skill or two</p><br><br>" +

        "<div class='editor_rrp11'>" +
        "I see you’ve got " + highlight_This("#") + " endorsements on LinkedIn for your " + highlight_This("SKILL_TYPE") + " skills and " + highlight_This("#") + " for " + highlight_This("SKILL_TYPE2") + ". Your profile definitely caught my attention as I was looking for experienced " + highlight_This("INDUSTRY") + " leaders." +
        "</div>",

        // About

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>‘About’</b> - They’ve got relevant experience or skills listed in the section they wrote about themselves</p><br><br>" +

        "<div class='editor_rrp12'>" +
        "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + ", and I saw you mention in your ‘about’ section that you " + highlight_This("ABOUT_QUOTE") + ". Definitely caught my eye!" + 
        "</div>",

        // Certifications

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Certifications</b> - They’ve got a RELEVANT (to the event) certification that they’ve completed</p><br><br>" +

        "<div class='editor_rrp13'>" +
        "I came across your LinkedIn profile looking for leaders in " + highlight_This("INDUSTRY") + ", and I saw you’re certified " + highlight_This("INDUSTRY") + " from " + highlight_This("CERTIFICATION_SOURCE") + "—definitely caught my attention." +
        "</div>",

        // Interests

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Interests</b> - They’re following a person/company/group that is interesting or out of the norm (ideally relevant to the event)</p><br><br>" +

        "<div class='editor_rrp14'>" +
        "I saw on your LinkedIn that one of your interests is " + highlight_This("INTEREST") + " — I thought " + highlight_This("HIS_HER_THEIR") + " recent " + highlight_This("ARTICLE_VIDEO_POST") + " on " + highlight_This("TOPIC") + " was really interesting." +
        "</div>",

        // No useful info

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment Personalization</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>No Useful Info</b> - If there is NOTHING on their profile but title and company</p><br><br>" +

        "<div class='editor_rrp20'>" +
        "I saw on LinkedIn that you’re the " + highlight_This("TITLE") + " at " + highlight_This("COMPANY") + ". I thought about reaching out to you on LinkedIn, but I wasn’t sure if you’re very active there — figured shooting you a quick email would be better." + 
        "</div>",

         // Promotion

         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Promotion</b></p><br><br>" +
 
         "<div class='editor_rrp_promotion2'>" +
         "Noticed on your LinkedIn that you’ve recently been promoted to " + highlight_This("NEW TITLE") + " at " + highlight_This("COMPANY") + ". Congratulations!" +
         "</div>",
 
         // College Alumni
 
         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>College Alumni</b></p><br><br>" +
 
         "<div class='editor_rrp_college2'>" +
         "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + " and saw that you’re an alumnus of " + highlight_This("UNIVERSITY") + ". I thought their recent " + highlight_This("ARTICLE VIDEO POST") + " on " + highlight_This("TOPIC") + " was a great one." +
         "</div>",
 
         // Current Responsibilities
 
         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Current Responsibilities</b></p><br><br>" +
 
         "<div class='editor_rrp_responsibilites2'>" + // NEEDS NEW
         "I came across your LinkedIn looking for leaders in " + highlight_This("INDUSTRY") + " and I noticed that you’re responsible for " + highlight_This("CURRENT_RESPONSIBILITIES") + " in your current role—definitely caught my attention." +
         "</div>",
 
         // Company News/Update
 
         "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment Personalization</p>" +
         "<p class='messagesubject'><i class='fa fa-envelope'></i> <b>Company News/Update</b></p><br><br>" +
 
         "<div class='editor_rrp_companyNews2'>" + // NEEDS NEW
         "I saw on LinkedIn that you’re the " + highlight_This("TITLE") + " at " + highlight_This("COMPANY") + ". I saw on " + highlight_This("COMPANY") +"’s LinkedIn that you recently " + highlight_This("NEWS") + "—seems like an exciting time to be there." +
         "</div>",

      ]

      const $rr_drafts_new = 

      [
        // NEW COLD REGISTRANT RECRUITMENT

        // 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> New Cold Registrant Recruitment - 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Lunch and Learn on " + $event_month_number + "/" + $event_day_number +"?" +"</p><br><br>" +

        "<div class='editor_rrp15'>" +
          "Hey {{FIRST_NAME}},<br><br>" +

          highlight_This("PERSONALIZATION") + " " + "<br><br>" +

          "Based on your profile, I thought you’d enjoy a virtual thought-leadership event I’m organizing on " + $event_long_date + " from " + $event_start_time + " " + $event_timezone + ".<br><br>" +
          
          $event_full_title + " will be an invite-only discussion between " + $event_audience_and_size_or_so + " over " + $event_panel_snippet + ".<br><br>" +
          
          "As an attendee, you’ll have the chance to hear our expert panel share their insights, learn from and network with your peers, and final attendees can enjoy lunch on us with a meal delivery code sent after the event.<br><br>" + 
          
          "If this seems relevant and interesting, may I send you more info?<br><br>" +
          
          "Have a great " + highlight_This("SEND_DAY") + ",<br><br>" +
        "</div>",

        // 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> New Cold Registrant Recruitment - 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:" +"</p><br><br>" +

        "<div class='editor_rrp16'>" +
          "Hey again {{FIRST_NAME}},<br><br>" +

          "Reaching back out to share our <span style='color:red;'><b><u>event website </u></b></span>" + " " +  highlight_This($event_website) + " which includes the discussion topics and our panel.<br><br>"+

          "<span class='personalization1'></span>" +

          $event_audience.charAt(0).toUpperCase() + $event_audience.slice(1) + " " + $event_customization_1 + "<br><br>" +

          "We'd love to hear your thoughts, experiences, and questions related to the above, to share the insights of our expert panelists, and also to connect you with peers in similar roles and industries.<br><br>" +
          
          "Does the content seem relevant to you? Let me know if you’d like to join us and I’m happy to sign you up.<br><br>" +
          
          "Hope you’re having a great day,<br><br>"+
          highlight_This("Signature") + "</div>",

        // 1.3
        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> New Cold Registrant Recruitment - 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> re:" +"</p><br><br>" +

        "<div class='editor_rrp17'>" +
          "Hi {{FIRST_NAME}},<br><br>" +

          "We love bringing together exceptional panels to discuss the challenges and opportunities impacting business professionals today.<br><br>" +
          
          "For " + $event_full_title + " we’ll be in conversation with the following leaders:<br>" +

          createPanelistList_full_title_company_only_listFormat() +

          $event_panel_highlight + " <br><br> " +

          "Along with our moderator from " + $event_client + ", the panel will be leading a discussion about " + $event_snippet + ".<br><br>" + 
          
          "You’ll also get the chance to meet the speakers and your fellow participants in smaller groups and discuss the event topics.<br><br>" + 
          
          "May I RSVP you, {{FIRST_NAME}}?<br><br>" +

          "Best,<br>" +
          "Steve" +
        "</div>",

        // 1.4

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> New Cold Registrant Recruitment - 1.4</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Re: {{FIRST_NAME}}, Lunch and Learn on " + $event_month_number + "/" + $event_day_number +"?" +"</p><br><br>" +

        "<div class='editor_rrp18'>" +

          "{{FIRST_NAME}}, just want to say one more time—I think you’d love this event.<br><br>" +

          $event_function_leaders.charAt(0).toUpperCase() + $event_function_leaders.slice(1) + " " + $event_customization_2 + "<br><br>" +

          "Our discussion of " + $event_theme.toLowerCase() + " promises to be valuable to all, and the conversation would definitely benefit from your participation.<br><br>" +
          
          "Hope you’re willing to join our conversation and also interested in the opportunity to network with other " + $event_function_leaders + ".<br><br>" +
          
          "And don’t forget, lunch is on us!<br><br>" + 
          
          "Can I count you in for " + $event_long_date + "?<br><br>" +

          highlight_This("Signature") +
        "</div>",

      ]

      const $linkedin_drafts = 
      // LinkedIn Message Templates

      [
        // LinkedIn Connection Request Campaigns

        // Version 1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Connection Request Campaigns - <b>Version 1</b></p>" +

        "Hi " + highlight_This("NAME") + "," + " I came across your profile looking for " + highlight_This("industry leaders") + ", and I thought you’d be a great fit for our virtual lunch & learn, " + $event_short_title + " on " + $event_month_number + "/" + $event_day_number + " from " + $event_time_display + " " + $event_timezone + " (meal delivery code included). Check out the website: <u>" + $event_website + "</u>. Let me know if you have any questions?<br><br>" + 
        
        $event_account_director_first_name + "<br><br><br><hr><br>" +
        
        // Version 2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Connection Request Campaigns - <b>Version 2</b></p>" +

        "Hi " + highlight_This("NAME") + "," + " I’m hosting an invite-only virtual event, " + $event_short_title + ", on " + $event_month_number + "/" + $event_day_number + " for " + highlight_This("industry") + " thought leaders. More details here: <u>" + $event_website + "</u>. Based on your profile, you’d be an insightful addition to the conversation. Can I count you in?<br><br>" + 
        
        $event_account_director_first_name + "<br><br><br><hr><br>" +
        
        // Version 3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Connection Request Campaigns - <b>Version 3</b></p>" +

        "Hey " + highlight_This("NAME") + ", I came across your profile and I was impressed. I think you’d make an excellent contribution to the invite-only virtual event " + $event_short_title + " that I’m hosting on " + $event_month_number + "/" + $event_day_number + ". Here is the website link, <u>" + $event_website + "</u>, and let me know what you think. Will you be able to make it?<br><br>" + 
        
        $event_account_director_first_name + "<br><br><br><hr><br>" +

        // Version 4

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Connection Request Campaigns - <b>Version 4</b></p>" +

        "Hi " + highlight_This("NAME") + ", you caught my eye as a fantastic potential registrant for a virtual thought-leadership event I’m organizing, " + $event_short_title + ". More details on the event website here: <u>" + $event_website + "</u>. Does the date/time work for you? Let me know, and I can add you to our RSVP list.<br><br>" + 

        $event_account_director_first_name + "<br><br><br><hr><br>" +

        // Version 5 (old copy)

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> LinkedIn Connection Request Campaigns - <b>Version 5 (old copy)</b></p>" +

        "Hi " + highlight_This("NAME") + ", I hope all is well! You caught my eye as a fantastic potential registrant for a thought-leadership event I’m organizing, " + $event_short_title + ". More details on the event website here: <u>" + $event_website + "</u>. Would you like to attend? Kindly reply w/ your email to register for this event or opt In for future ones.<br><br>" + 
        
        $event_account_director_first_name + "<br><br><br><hr><br>",

        // LinkedIn Campaigns - MESSAGE TYPE 2

        // LinkedIn 1st Degree Connections Message

        // Version 1

        "<p class='align-items-center' style='font-weight: bold;'>" + highlight_This("First Touch Message") + "</p>"

        +

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>1</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who we invited to another event over the past month or so <span style='color:red;'>AND ACCEPTED</span></i></p>
        </div>`
        
        +

        "Hi " + highlight_This("NAME") + ", I was glad to see that you were interested in " + highlight_This("PAST EVENT") + "! I hope you enjoyed the event and gained valuable insights from our panelists.<br><br>" + 
        
        "It would be great to see you at an upcoming virtual event with similar content themes." + " We’re hosting " + $event_full_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ". Check out the event website: <u>" + $event_website + "</u> and let me know what you think!<br><br>" + 

        "Can I count you in?<br><br>" +
        
        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +
        
        // Version 2

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>2</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who we invited to another event over the past month or so <span style='color:red;'>AND DECLINED</span></i></p>
        </div>`

        +

        "Hi " + highlight_This("NAME") + ", I noticed that you weren’t able to make our " + highlight_This("PAST_EVENT") + " event, but understand it can be challenging to find a good time to participate! It would be great to connect at another one of our virtual events. <br><br>" + 
        
        "We’re hosting " + $event_short_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", and based on your background I think it may spark your interest. Check out the event website: <u>" + $event_website + "</u> <br><br>" + 

        "We’ll also provide all final attendees with a $30 charity donation code! Let me know your thoughts? <br><br>" +
        
        "Cheers,<br>" +
        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 3

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>3</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who we invited to another event more than one month ago or so but <span style='color:red;'>DID NOT RESPOND</span></i></p>
        </div>`

        +

        "Hi " + highlight_This("NAME") + ", BDI is hosting another virtual event that I thought you might be the perfect candidate for—" + $event_full_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ". Check out the event website: <u>" + $event_website + "</u> and let me know what you think!<br><br>" + 
        
        "We’ll be offering all final attendees a code to donate $30 to the charity of their choice after the event. We hope you’ll help us partner to do some good!<br><br>" + 

        "Can I count you in?<br><br>" +
        
        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +
        
        // Version 4

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>4</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who have not received a recent invite to a BDI event</i></p>
        </div>`

        +

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>4A</p>
          <div class='flex-col'>
            <p class='align-items-center' style='font-weight: bold;'><i>Reached out via email</i></p>
            <p class='align-items-center' style='font-weight: bold;'><i>Check the profile on LinkMatch to see if they have “Email Sent” for this event marked as an “Activity”</i></p>
          </div>
        </div>
        <br>
        
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re doing well!<br><br>" +
        
        "<i>I sent you an email about our upcoming virtual event, but I figured reaching out on LinkedIn might be easier.</i><br><br>" +

        "BDI is hosting " + $event_short_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", and I thought you might be the perfect candidate to attend. Check out the event website: <u>" + $event_website + "</u> and let me know what you think!<br><br>" +

        "We’ll be offering all final attendees a code to donate $30 to the charity of their choice after the event. We hope you’ll help us partner to do some good!<br><br>" +

        "Can I count you in?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>4B</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Did not reach out via email</i></p>
        </div>`

        +

        "Hi " + highlight_This("NAME") + ", hope you’re doing well!<br><br>" +

        "<i>I wanted to invite you to an upcoming virtual event and I figured reaching out on LinkedIn might be the easiest way to get in touch.</i><br><br>" +

        "BDI is hosting " + $event_short_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", and I thought you might be the perfect candidate to attend. Check out the event website: <u>" + $event_website + "</u> and let me know what you think!<br><br>" +

        "We’ll be offering all final attendees a code to donate $30 to the charity of their choice after the event. We hope you’ll help us partner to do some good!.<br><br>" +

        "Can I count you in? <br><br>" +
        
        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 5

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>5</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who are invited to a BDI event on the same day and RSVP’d no due to time conflict</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re doing well!<br><br>" +
        
        "I know you have a conflict at " + highlight_This("CONFLICT TIME") + " on " + $event_long_date + ", but I’m hosting " + $event_short_title + " from " + $event_time_display + " " + $event_timezone + " and was hoping this time might work better for you?<br><br>" + 

        "Let me know after you check out the event website: <u>" + $event_website + "</u>. Would love to have you there, and we’d love to have you help us do some good with a $30 charity code we’ll send out post-event.<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

         // Version 6

        `<div class='flex-row'>
         <p class='messagetypename number-icon-custom'>6</p>
         <p class='align-items-center' style='font-weight: bold;'><i>Those who are invited to a BDI event on the same day and RSVP’d no due to event topic</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", how’s your " + getTodaysDate() + " going?<br><br>" +
        
        "I know you didn’t think the content for " + highlight_This("OTHER EVENT TITLE") + " was up your alley, so I thought " + $event_short_title + " on the same day (" + $event_long_date + ") might be a better fit.<br><br>" + 

        "Are you able to join us " + $event_time_display + " " + $event_timezone + " to discuss " + highlight_This("EVENT TOPIC") + "? Check out the event website: <u>" + $event_website + "</u>, and let me know what you think!<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 7

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>7</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who have been a panelist for BDI events before</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", how’s your " + getTodaysDate() + " going?<br><br>" +
        
        "I wanted to thank you again for doing such an amazing job speaking at " + highlight_This("PAST EVENT TITLE") + ". It was really neat to hear what " + highlight_This("COMPANY") + " is doing in the " + $event_function + " space.<br><br>" +

        "I’m reaching out again to see if you might be interested in " + highlight_This("attending/speaking") + " at " + highlight_This("(CHOOSE ONE!)") + " our upcoming event " + $event_short_title + " on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ".<br><br>" +

        "We’ll be providing a delivery code for a $30 donation to the charity of your choice, and I’m personally really looking forward to chatting about " + highlight_This("EVENT TOPIC") + ".<br><br>" +

        "Are you able to join us again?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 8

        `<div class='flex-row'>
          <p class='messagetypename number-icon-custom'>8</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Last-minute registrant invites (within a few days)</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re having a great " + getTodaysDate() + "!<br><br>" +
        
        "I just got off a prep call with our panel for " + highlight_This("WEEKDAY’s") + " virtual event, " + $event_full_title + ", and I’m really looking forward to the conversation. Feel free to check out the panelists’ profiles:<br><br>" +

        createPanelistList_first_and_last_name_linkedin() + "<br>" +

        "I think you’d really enjoy it as well and, as we’ll also provide a $30 code to donate to the charity of your choice.<br><br>" +

        "Can you join us at 12 pm " + $event_timezone + " on " + $event_date_full_numeric + "?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 9

        `<div class='flex-row'>
         <p class='messagetypename number-icon-custom'>9</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who expressed previous interest in being panelists only</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re doing well!<br><br>" +
        
        "I know you previously expressed interest in panelist opportunities, so I wanted to share some details for our upcoming virtual event with you. " + $event_full_title + " will take place on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", and I’d love to have you speak about " + highlight_This("EVENT TOPIC") + ". <br><br>" +

        "Take a look at the event website: <u>" + $event_website + "</u>, and let me know your thoughts. Are you interested in speaking?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 10

        `<div class='flex-row'>
         <p class='messagetypename number-icon-custom'>10</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Those who expressed previous interest in certain event topics only</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re doing well!<br><br>" +
        
        "I know you previously expressed interest in " + highlight_This("EVENT TOPIC OF INTEREST") + " events, so I wanted to share some details for our upcoming virtual event with you. " + $event_short_title + " will take place on " + $event_long_date + " from " + $event_time_display + " " + $event_timezone + ", and I’d love for you to " + highlight_This("attend/participate (PICK ONE BASED ON RR OR PR)..") + ".<br><br>" +

        "Take a look at the event website: <u>" + $event_website + "</u>, and let me know your thoughts. Are you interested in speaking?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>" +

        // Version 11

        `<div class='flex-row'>
         <p class='messagetypename number-icon-custom'>11</p>
         <p>${highlight_This("Second Touch Messages")}</p><br><br>
         <p class='align-items-center' style='font-weight: bold;'><i>Follow-Up/Second Touch Message</i></p>
        </div>
        <br>  
        `

        +

        "Hi " + highlight_This("NAME") + ", hope you’re having a great " + getTodaysDate() + "!<br><br>" +
        
        "I’m following up on my previous message about " + $event_full_title + " on " + $event_long_date + ". I think you’d be an excellent addition to the virtual conversation! We have some confirmed panelists that I’m excited to share with you:<br><br>" +

        createPanelistList_full() + "<br>" +

        "Will I see you there?<br><br>" +

        highlight_This("SIGNATURE") + "<br><br><br><hr><br>"

        // Version 12

        /*

        `<div class='flex-row'>
         <p class='messagetypename number-icon-custom'>12</p>
          <p class='align-items-center' style='font-weight: bold;'><i>Follow-up // When the panel is full</i></p>
        </div>
        <br>  
        `

        +

        "Hey " + highlight_This("NAME") + "<br><br>" + 
        
        "Just wanted to send an update and let you know our panel is now full, but I would still love to have you participate in the event on " + $event_month_number + "/" + $event_day_number + "!<br><br>" +
        
        "Our format is highly interactive and all attendees are welcome to contribute to the conversation. I’m sure you’d both add to and find a ton of value in the discussion on " + $event_theme + ".<br><br>" +

        "You’re also more than welcome to bring an interested colleague!<br><br>" +

        "Can I count you in?<br>" +

        highlight_This("SIGNATURE") + "<br><br><br><br>"

        */

      ]

      const $rc_calendar_invite_panelists = 

      [
        // CALENDAR INVITE TO PANELISTS (EVENT DAY)

        // 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Calendar Invite to Panelists (EVENT DAY)</p>" +

        "<div class='editor_rrp15'>" +
          "<b>Event Website:</b> " + $event_website  + "<br><br>" +

          "<b>Agenda:</b> " + "<br>" +
          `
            <ul>
              <li><b>11:45am:</b> The moderator and panel will join 15 minutes early to chat through any last questions and get ready for the event to start.</li>
              <li><b>12:00pm:</b> The event starts, attendees are let in, welcome remarks.</li>
              <li><b>12:05pm:</b> We move to smaller groups of 6-10 in breakout rooms to go through introductions and some networking all around.</li>
              <li><b>12:15pm:</b> We’ll come back to the main room for the panel discussion. The moderator will introduce themselves, and ask the panel to do the same.</li>
              <li><b>1:10pm:</b> Back to our smaller groups for very interactive discussions on the same or adjacent topics to the ones we covered on the panel—attendees will be able to share their experiences as well.</li>
              <li><b>1:30pm:</b> Event officially ends.</li>
            </ul>
          ` +
        "</div>"

      ]

      const doubleSpaceAndLine = "<br><br><br>" + "<hr>" + "<br><br><br>";
  
      function generateCustomMessage() {

        // Show breadcrumbs
        let breadcrumbs = document.getElementById("drafts-breadcrumbs");
        breadcrumbs.innerHTML = "<p><span> " + $selectedEvent[0].fields.Name + " </span> " + " > " + " <span>" + $selectedMessageType + " </span> " + " > " + " <span> " + $selectedMessageName + " </span></p><br><hr>";

        if ($selectedMessageType == "Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            $drafts.html($pr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[3] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[4] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($pr_drafts_cold_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($pr_drafts_cold_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "2.1") {
            return $drafts.html($pr_drafts_cold_new_copy[3]);
          } else if ($selectedMessageName == "2.2") {
            return $drafts.html($pr_drafts_cold_new_copy[4]);
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($pr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[3] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[4] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          }
        } else if ($selectedMessageType == "Cold Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            $drafts.html($pr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($pr_drafts_cold_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($pr_drafts_cold_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($pr_drafts_cold_new_copy[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($pr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          }
        }
        
        else if ($selectedMessageType == "Cold Registrant Recruitment") {
          if ($selectedMessageName == "1.1"){
            $drafts.html($rr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($rr_drafts_cold_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($rr_drafts_cold_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($rr_drafts_cold_new_copy[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($rr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          }
        } else if ($selectedMessageType == "Opt-in Registrant Recruitment") {
          if ($selectedMessageName == "1.1"){
            $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($rr_drafts_optin_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($rr_drafts_optin_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($rr_drafts_optin_new_copy[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          }
        } else if ($selectedMessageType == "Past Attendee Registrant Recruitment") { // $rr_drafts_past_new_copy
          if ($selectedMessageName == "1.1"){
            $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($rr_drafts_past_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($rr_drafts_past_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($rr_drafts_past_new_copy[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          }
        } else if ($selectedMessageType == "Opt-in Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($pr_drafts_oi_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            $drafts.html($pr_drafts_oi_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "Full Sequence") {
            $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
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
          } if ($selectedMessageName == "Calendar Invite to Sales Team + AGENDA"){
            return $drafts.html($cc_drafts[4]);
          } if ($selectedMessageName == "Calendar Invite to Sales Team + EVENT"){
            return $drafts.html($cc_drafts[5]);
          }
        } else if ($selectedMessageType == "Registrant Communication") {
            if ($selectedMessageName == "Sorry We Missed You"){
              return $drafts.html($rc_drafts[0]);
            } if ($selectedMessageName == "Thank You for Attending") {
              return $drafts.html($rc_drafts[1]);
            } if ($selectedMessageName == "RSVP YES - Confirmed") {
              return $drafts.html($rc_drafts[2]);
            } if ($selectedMessageName == "RSVP YES - Tentative") {
              return $drafts.html($rc_drafts[3]);
            } if ($selectedMessageName == "Final Confirmation") {
              return $drafts.html($rc_drafts[4]);
            } if ($selectedMessageName == "See You Today" || $selectedMessageName == "SYT" || $selectedMessageName == "See You Today (Virtual, Hoppier)") {
              return $drafts.html($rc_drafts[5]);
            } if ($selectedMessageName == "Onboarding Panelist - Confirmed") {
              return $drafts.html($rc_drafts[6]);
            } if ($selectedMessageName == "Onboarding Panelist - Tentative") {
              return $drafts.html($rc_drafts[7]);
            } if ($selectedMessageName == "Scheduling Panel Prep (75 min)") {
              return $drafts.html($rc_drafts[8]);
            } if ($selectedMessageName == "Scheduling Panel Prep (90 min)") {
              return $drafts.html($rc_drafts[9]);
            } if ($selectedMessageName == "Calendar Invite for Panel Prep Call (75 min)") {
              return $drafts.html($rc_drafts[10]);
            } if ($selectedMessageName == "One Week Reminder") {
              return $drafts.html($rc_drafts[11]);
            } if ($selectedMessageName == "Invite for RSVP NO Responses") {
              return $drafts.html($rc_drafts[12]);
            } if ($selectedMessageName == "Confirmation Calls Script") {
              console.log($rc_drafts[13])
              return $drafts.html($rc_drafts[13]);
            } if ($selectedMessageName == "Event Live Now Follow Up") {
              return $drafts.html($rc_drafts[14]);
            } if ($selectedMessageName == "Engaged Follow up") { 
              $drafts.html($rc_calendar_invite_panelists[0]);
              new Quill('.editor_rrp15',{theme:'snow',});
            } if ($selectedMessageName == "One Week Reminder (w/out Registration List)") { 
              return $drafts.html($rc_drafts[16]);
            } if ($selectedMessageName == "Here's What You Missed") { // Here's What You Missed
              console.log($rc_drafts)
              return $drafts.html($rc_drafts[17]);
            } else return $drafts.html("<p>Template Not Found</p>")
          } else if ($selectedMessageType == "Past Attendee Panel Recruitment") {
            if ($selectedMessageName == "1.1"){
              return $drafts.html($pr_drafts_pa_new_copy[0] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[1] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[2] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[3] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[4] + "<br><br>");
            } else if ($selectedMessageName == "1.2") {
              return $drafts.html($pr_drafts_pa_new_copy[1]);
            } if ($selectedMessageName == "1.3") {
              return $drafts.html($pr_drafts_pa_new_copy[2]);
            } else if ($selectedMessageName == "2.1") {
              return $drafts.html($pr_drafts_pa_new_copy[3]);
            } if ($selectedMessageName == "2.2") {
              return $drafts.html($pr_drafts_pa_new_copy[4]);
            } else if ($selectedMessageName == "Full Sequence") {
              return $drafts.html($pr_drafts_pa_new_copy[0] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[1] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[2] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[3] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[4] + "<br><br>");
            }
          }
            else if ($selectedMessageType == "Opt-In Panel Recruitment") {
              if ($selectedMessageName == "1.1"){
                return $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[3] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[4] + "<br><br>");
              } else if ($selectedMessageName == "1.2") {
                return $drafts.html($pr_drafts_oi_new_copy[1]);
              } if ($selectedMessageName == "1.3") {
                return $drafts.html($pr_drafts_oi_new_copy[2]);
              } else if ($selectedMessageName == "2.1") {
                return $drafts.html($pr_drafts_oi_new_copy[3]);
              } if ($selectedMessageName == "2.2") {
                return $drafts.html($pr_drafts_oi_new_copy[4]);
              } else if ($selectedMessageName == "Full Sequence") {
                return $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[3] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[4] + "<br><br>");
              }
            }
            else if ($selectedMessageType == "Past Attendee Registrant Recruitment") {
              if ($selectedMessageName == "1.1"){
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
              } else if ($selectedMessageName == "1.2") {
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_past_new_copy[1]);
              } if ($selectedMessageName == "1.3") {
                return $drafts.html($rr_drafts_past_new_copy[2]);
              } if ($selectedMessageName == "1.4") {
                return $drafts.html($rr_drafts_past_new_copy[3]);
              } else if ($selectedMessageName == "Full Sequence") {
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
              }
            }
            else if ($selectedMessageType == "Opt-In Registrant Recruitment") {
              if ($selectedMessageName == "1.1"){
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
              } else if ($selectedMessageName == "1.2") {
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_optin_new_copy[1]);
              } if ($selectedMessageName == "1.3") {
                return $drafts.html($rr_drafts_optin_new_copy[2]);
              } if ($selectedMessageName == "1.4") {
                return $drafts.html($rr_drafts_optin_new_copy[3]);
              } else if ($selectedMessageName == "Full Sequence") {
                document.querySelector(".personalization-container").style.display = "block";
                return $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
              }
            }
            else if ($selectedMessageType == "Panel Recruitment Personalization") {
              if ($selectedMessageName == "Create Personalization"){
                $drafts.html($pr_personalized_drafts[0] + doubleSpaceAndLine + $pr_personalized_drafts[1] + doubleSpaceAndLine + $pr_personalized_drafts[2] + doubleSpaceAndLine + $pr_personalized_drafts[3] + doubleSpaceAndLine + $pr_personalized_drafts[4] + doubleSpaceAndLine + $pr_personalized_drafts[5] + doubleSpaceAndLine + $pr_personalized_drafts[6] + doubleSpaceAndLine + $pr_personalized_drafts[7] + doubleSpaceAndLine + $pr_personalized_drafts[8] + doubleSpaceAndLine + $pr_personalized_drafts[9] + "<br><br>");
                var quill1 = new Quill('.editor_rrp1',{theme:'snow',});
                var quill2 = new Quill('.editor_rrp2',{theme:'snow',});
                var quill4 = new Quill('.editor_rrp4',{theme:'snow',});
                var quill5 = new Quill('.editor_rrp5',{theme:'snow',});
                var quill6 = new Quill('.editor_rrp6',{theme:'snow',});
                var quill7 = new Quill('.editor_rrp7',{theme:'snow',});
                var quill19 = new Quill('.editor_rrp19',{theme:'snow',});
                var quill3 = new Quill('.editor_rrp_promotion1',{theme:'snow',}); // promotion
                var quill21 = new Quill('.editor_rrp_responsibilites1',{theme:'snow',}); // Current Responsibilities
                var quill22 = new Quill('.editor_rrp_college1',{theme:'snow',}); // College Alumni
                var quill23 = new Quill('.editor_rrp_companyNews1',{theme:'snow',}); // Company News/Update
                return;
              }
            }
            else if ($selectedMessageType == "Registrant Recruitment Personalization") {
              if ($selectedMessageName == "Create Personalization"){
                $drafts.html($rr_personalized_drafts[0] + doubleSpaceAndLine + $rr_personalized_drafts[1] + doubleSpaceAndLine + $rr_personalized_drafts[2] + doubleSpaceAndLine + $rr_personalized_drafts[3] + doubleSpaceAndLine + $rr_personalized_drafts[4] + doubleSpaceAndLine + $rr_personalized_drafts[5] + doubleSpaceAndLine + $rr_personalized_drafts[6] + doubleSpaceAndLine + $rr_personalized_drafts[7] + doubleSpaceAndLine + $rr_personalized_drafts[8] + doubleSpaceAndLine + $rr_personalized_drafts[9] + "<br><br>");
                var quill8 = new Quill('.editor_rrp8',{theme:'snow',});
                var quill9 = new Quill('.editor_rrp9',{theme:'snow',});
                var quill10 = new Quill('.editor_rrp10',{theme:'snow',});
                var quill11 = new Quill('.editor_rrp11',{theme:'snow',});
                var quill12 = new Quill('.editor_rrp12',{theme:'snow',});
                var quill13 = new Quill('.editor_rrp13',{theme:'snow',});
                var quill14 = new Quill('.editor_rrp14',{theme:'snow',});
                var quill20 = new Quill('.editor_rrp20',{theme:'snow',});
                var quill24 = new Quill('.editor_rrp_promotion2',{theme:'snow',}); // promotion
                var quill25 = new Quill('.editor_rrp_responsibilites2',{theme:'snow',}); // Current Responsibilities
                var quill26 = new Quill('.editor_rrp_college2',{theme:'snow',}); // College Alumni
                var quill27 = new Quill('.editor_rrp_companyNews2',{theme:'snow',}); // Company News/Update
                return;
              }
            } else if ($selectedMessageType == "Registrant Recruitment New") {
              if ($selectedMessageName == "1.1"){
                document.querySelector(".personalization-container").style.display = "block";
                $drafts.html($rr_drafts_new[0] + doubleSpaceAndLine + $rr_drafts_new[1] + doubleSpaceAndLine + $rr_drafts_new[2] + doubleSpaceAndLine + $rr_drafts_new[3] + "<br><br>");
                new Quill('.editor_rrp15',{theme:'snow',});
                new Quill('.editor_rrp16',{theme:'snow',});
                new Quill('.editor_rrp17',{theme:'snow',});
                new Quill('.editor_rrp18',{theme:'snow',});
              } else if ($selectedMessageName == "1.2") {
                document.querySelector(".personalization-container").style.display = "block";
                $drafts.html($rr_drafts_new[1]);
                new Quill('.editor_rrp16',{theme:'snow',});
              } if ($selectedMessageName == "1.3") {
                $drafts.html($rr_drafts_new[2]);
                new Quill('.editor_rrp17',{theme:'snow',});
              } if ($selectedMessageName == "1.4") {
                $drafts.html($rr_drafts_new[3]);
                new Quill('.editor_rrp18',{theme:'snow',});
              } else if ($selectedMessageName == "Full Sequence") {
                document.querySelector(".personalization-container").style.display = "block";
                $drafts.html($rr_drafts_new[0] + doubleSpaceAndLine + $rr_drafts_new[1] + doubleSpaceAndLine + $rr_drafts_new[2] + doubleSpaceAndLine + $rr_drafts_new[3] + "<br><br>");
                new Quill('.editor_rrp15',{theme:'snow',});
                new Quill('.editor_rrp16',{theme:'snow',});
                new Quill('.editor_rrp17',{theme:'snow',});
                new Quill('.editor_rrp18',{theme:'snow',});
              }
            } else if ($selectedMessageType == "LinkedIn Message Templates") {
              if ($selectedMessageName == "LinkedIn Connection Request Campaigns"){
                $drafts.html($linkedin_drafts[0]);
              } else if ($selectedMessageName == "LinkedIn 1st Degree Connections Message"){
                $drafts.html($linkedin_drafts[1]);
              }
            }
        else return $drafts.html("This message does not exist.");
      };

      function generateAutomaticMessage() {
        $("#predrafted-preview").append(predraftedHTML);
        predraftedHTML.html("");

        if ($selectedMessageType == "Panel Recruitment" || $selectedMessageType == "PR") {
          if ($selectedMessageName == "1.1"){
            predraftedHTML.html($pr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[3] + doubleSpaceAndLine + $pr_drafts_cold_new_copy[4] + "<br><br>");
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($pr_drafts_cold_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            predraftedHTML.html($pr_drafts_cold_new_copy[2]);
            return document.querySelector(".personalization-container").style.display = "block";
          } else if ($selectedMessageName == "2.1") {
            return predraftedHTML.html($pr_drafts_cold_new_copy[3]);
          } else if ($selectedMessageName == "2.2") {
            return predraftedHTML.html($pr_drafts_cold_new_copy[4]);
          }
        } else if ($selectedMessageType == "Registrant Recruitment" || $selectedMessageType == "RR") { // Takes single select name from emails table so has to remain Registrant Recruitment
          if ($selectedMessageName == "1.1"){
            return predraftedHTML.html($rr_drafts_cold_new_copy[0] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[1] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[2] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[3] + doubleSpaceAndLine + $rr_drafts_cold_new_copy[4] + "<br><br>");
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($rr_drafts_cold_new_copy[1]);
          } if ($selectedMessageName == "1.3") {
            return predraftedHTML.html($rr_drafts_cold_new_copy[2]);
          } else if ($selectedMessageName == "1.4") {
            console.error("testing");
            return predraftedHTML.html($rr_drafts_cold_new_copy[3]);
            //return predraftedHTML.html($rr_drafts_new[3]);
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
            } if ($selectedMessageName == "See You Today" || $selectedMessageName == "SYT" || $selectedMessageName == "See You Today (Virtual, Hoppier)") {
               return predraftedHTML.html($rc_drafts[5]);
            } if ($selectedMessageName == "One Week Reminder") {
              return predraftedHTML.html($rc_drafts[10]);
            } if ($selectedMessageName == "Event Live Now Follow Up") {
              return $drafts.html($rc_drafts[13]);
            } if ($selectedMessageName == "One Week Reminder (w/out Registration List") {
              return $drafts.html($rc_drafts[15]);
            } if ($selectedMessageName == "Here's What You Missed") { // Here's What You Missed
              return $drafts.html($rc_drafts[17])
            }
            else if ($selectedMessageType == "Past Attendee Panel Recruitment") {
              if ($selectedMessageName == "1.1"){
                return $drafts.html($pr_drafts_pa_new_copy[0] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[1] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[2] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[3] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[4] + "<br><br>");
              } else if ($selectedMessageName == "1.2") {
                return $drafts.html($pr_drafts_pa_new_copy[1]);
              } if ($selectedMessageName == "1.3") {
                return $drafts.html($pr_drafts_pa_new_copy[2]);
              } else if ($selectedMessageName == "2.1") {
                return $drafts.html($pr_drafts_pa_new_copy[3]);
              } if ($selectedMessageName == "2.2") {
                return $drafts.html($pr_drafts_pa_new_copy[4]);
              } else if ($selectedMessageName == "Full Sequence") {
                return $drafts.html($pr_drafts_pa_new_copy[0] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[1] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[2] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[3] + doubleSpaceAndLine + $pr_drafts_pa_new_copy[4] + "<br><br>");
              }
            }
          else if ($selectedMessageType == "Opt-In Panel Recruitment") {
            if ($selectedMessageName == "1.1"){
              return $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[3] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[4] + "<br><br>");
            } else if ($selectedMessageName == "1.2") {
              return $drafts.html($pr_drafts_oi_new_copy[1]);
            } if ($selectedMessageName == "1.3") {
              return $drafts.html($pr_drafts_oi_new_copy[2]);
            } else if ($selectedMessageName == "2.1") {
              return $drafts.html($pr_drafts_oi_new_copy[3]);
            } if ($selectedMessageName == "2.2") {
              return $drafts.html($pr_drafts_oi_new_copy[4]);
            } else if ($selectedMessageName == "Full Sequence") {
              return $drafts.html($pr_drafts_oi_new_copy[0] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[1] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[2] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[3] + doubleSpaceAndLine + $pr_drafts_oi_new_copy[4] + "<br><br>");
            }
          }
          else if ($selectedMessageType == "Past Attendee Registrant Recruitment") {
            if ($selectedMessageName == "1.1"){
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
            } else if ($selectedMessageName == "1.2") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_past_new_copy[1]);
            } if ($selectedMessageName == "1.3") {
              return $drafts.html($rr_drafts_past_new_copy[2]);
            } if ($selectedMessageName == "1.4") {
              return $drafts.html($rr_drafts_past_new_copy[3]);
            } else if ($selectedMessageName == "Full Sequence") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_past_new_copy[0] + doubleSpaceAndLine + $rr_drafts_past_new_copy[1] + doubleSpaceAndLine + $rr_drafts_past_new_copy[2] + doubleSpaceAndLine + $rr_drafts_past_new_copy[3] + "<br><br>");
            }
          }
          else if ($selectedMessageType == "Opt-In Registrant Recruitment") {
            if ($selectedMessageName == "1.1"){
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
            } else if ($selectedMessageName == "1.2") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_optin_new_copy[1]);
            } if ($selectedMessageName == "1.3") {
              return $drafts.html($rr_drafts_optin_new_copy[2]);
            } if ($selectedMessageName == "1.4") {
              return $drafts.html($rr_drafts_optin_new_copy[3]);
            } else if ($selectedMessageName == "Full Sequence") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_optin_new_copy[0] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[1] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[2] + doubleSpaceAndLine + $rr_drafts_optin_new_copy[3] + "<br><br>");
            }
          }
          else if ($selectedMessageType == "Registrant Recruitment New") {
            if ($selectedMessageName == "1.1"){
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_new[0] + doubleSpaceAndLine + $rr_drafts_new[1] + doubleSpaceAndLine + $rr_drafts_new[2] + doubleSpaceAndLine + $rr_drafts_new[3] + "<br><br>");
            } else if ($selectedMessageName == "1.2") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($rr_drafts_new[1]);
            } if ($selectedMessageName == "1.3") {
              return $drafts.html($rr_drafts_new[2]);
            } if ($selectedMessageName == "1.4") {
              return $drafts.html($rr_drafts_new[2]);
            } else if ($selectedMessageName == "Full Sequence") {
              document.querySelector(".personalization-container").style.display = "block";
              return $drafts.html($$rr_drafts_new[0] + doubleSpaceAndLine + $rr_drafts_new[1] + doubleSpaceAndLine + $rr_drafts_new[2] + doubleSpaceAndLine + $rr_drafts_new[3] + "<br><br>");
            }
          }
          else if ($selectedMessageName == "See You Today" || $selectedMessageName == "SYT" || $selectedMessageName == "See You Today (Virtual, Hoppier)") {
            return predraftedHTML.html($rc_drafts[5]);
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
