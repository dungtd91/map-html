var mapApp = function() {

    var typeList = [];
    var cityList = [];

    const DEFAULT_TYPE_LIST = [
        {
            id: 1,
            name: 'Showroom/ Đại lý',
            icon: './images/icon-showroom.svg'
        },
        {
            id: 2,
            name: 'Xưởng dịch vụ',
            icon: './images/icon-xuong-dich-vu.svg'
        },
        {
            id: 3,
            name: 'Trạm sạc ô tô điện',
            icon: './images/icon-tram-sac-oto-dien.svg'
        },
        {
            id: 4,
            name: 'Trạm sạc xe máy điện',
            icon: './images/icon-tram-sac-xe-may-dien.svg'
        }
    ]

    var options = {
        center: new google.maps.LatLng(31.7132981,31.3291027),
        zoom:4,
        mapTypeId:google.maps.MapTypeId.ROADMAP,
        styles: window.mapStyle
    };

    function init(settings) {
        map = new google.maps.Map(document.getElementById( settings.idSelector ), options);
        loadMarkers();
        initAutocomplete(settings);
        renderFilterByTypes();
        renderFilterByCities();
    }

    function initAutocomplete(settings) {
        var input_autocomplete = document.getElementById(settings.inputAutoCompleteSelector);
        var autocomplete = new google.maps.places.Autocomplete(input_autocomplete);

        // map.controls[google.maps.ControlPosition.TOP_CENTER].push(input_autocomplete);

        var marker = new google.maps.Marker({
            map: map
        });

        autocomplete.bindTo('bounds', map);

        autocomplete.setFields(
            ['address_components', 'geometry', 'name']);

        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var bounds = new google.maps.LatLngBounds();
            marker.setPosition(place.geometry.location);

            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            map.fitBounds(bounds);
        });
    }

    function itemTypeMap(type) {
        var found = $.grep(DEFAULT_TYPE_LIST, function(item) {
            return item.id === type
        });

        if(found)
            return found.slice(0, 1).shift();

        return false;
    }

    function itemMap(item) {
        return {
            lat: item.geometry.coordinates[0],
            lng: item.geometry.coordinates[1],
            id: item._id,
            name: item.name,
            city: item.properties.city,
            address: item.properties.address,
            type: itemTypeMap(item.type),
            content: item.description.replace('\n', '<br>')
        }
    }

    /*
		=======
		MARKERS
		=======
	*/
    markers = {};
    markerList = [];

    function loadMarkers(itemList) {

        var data = (typeof  itemList !== 'undefined') ? itemList : window.jsonData;

        for (i = 0; i <= data.length - 1; i++) {

            var item = itemMap(data[i]);

            if( markerList.indexOf(item.id) !== -1 ) continue;

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng( item.lat, item.lng),
                title: item.name,
                markerID: item.id,
                icon: item.type.icon,
                map: map
            });

            const checkTypeExist = element => element.id == item.type.id;
            if(!typeList.some(checkTypeExist)) {
                typeList.push(item.type);
            }

            if(cityList.indexOf(item.city) === -1) {
                cityList.push(item.city)
            }

            markers[item.id] = marker;
            markerList.push(item.id);

            var infoWindow = new google.maps.InfoWindow({
                maxWidth: 300
            });

            var content = ['<div class="iw"><div class="iw-header"><img src="'+item.type.icon+'" alt="'+item.type.name+'">'+item.type.name+'</div>',
                '<div class="iw-content">' +
                '<h2 class="iw-name">'+item.name+'</h2>' +
                '<div class="iw-address"><span class="label">Địa chỉ<a href="#">Chỉ đường</a></span>'+item.address+'</div>' +
                '<div class="iw-main-content">'+item.content+'</div></div>',
                '<div class="button-wrap"><a class="button button-register" href="#">Đặt lịch lái thử</a></div>',]
                .join('');


            google.maps.event.addListener(marker, 'click', function (marker, content){
                return function () {
                    infoWindow.setContent(content);
                    infoWindow.open(map, marker);
                }
            }(marker, content));
        }
    }

    function removeMarker(id) {
        if( markers[id] ) {
            markers[id].setMap(null);
            loc = markerList.indexOf(id);
            if (loc > -1) markerList.splice(loc, 1);
            delete markers[id];
        }
    }


    /*
        ======
        FILTER
        ======
    */

    var filterMap;

    var filter = {
        type: 0,
        city: 0
    }

    function reduceArray(a) {
        r = a.shift().reduce(function(res, v) {
            if (res.indexOf(v) === -1 && a.every(function(a) {
                return a.indexOf(v) !== -1;
            })) res.push(v);
            return res;
        }, []);
        return r;
    }

    function renderFilterByTypes() {
        if(!typeList.length)
            return;

        var typesContainer = $('#types');

        typeList = typeList.sort(function (a, b){
            if ( a.id < b.id ) {return -1;}
            if ( a.id > b.id ){ return 1;}
            return 0;
        });

        for ( var key in typeList) {
            var type = typeList[key];

            var checkboxTypeHTML = document.createElement('div');
            checkboxTypeHTML.innerHTML = '<img src="' + type.icon + '"> ' + '&nbsp' + type.name + '<input class="checkbox-type" name="types" checked="checked" type="checkbox" value="'+type.id+'">';
            typesContainer.append(checkboxTypeHTML);
        }
    }

    function renderFilterByCities() {
        if(!cityList.length)
            return;

        var cityContainer = $('#city');

        cityList = cityList.sort(function (a, b){
            if(a < b) { return -1; }
            if(a > b) { return 1; }
            return 0;
        });

        for ( var key in cityList) {
            var city = cityList[key];

            cityContainer.append('<option value="'+city+'">'+city+'</option>');
        }

        cityContainer.select2();
    }


    function filterMarker(filterType, value) {
        var results = [];

        if(Array.isArray(value) ) {
            filter[filterType] = value.join(',');
        } else {
            filter[filterType] = value ? value : 0;
        }

        for( key in filter ) {
            if(!filter.hasOwnProperty(key) && !( filter[key] !== 0 )) {
                loadMarkers();
                return false;
            } else if (filter[key] !== 0) {
                results.push( filterMap[key]( filter[key] ) );
            }
        }

        if( filter[filterType] === 0 ) results.push( window.jsonData );

        if( results.length === 1 ) {
            results = results[0];
        } else {
            results = reduceArray( results );
        }

        loadMarkers( results );
    }

    // Map

    filterMap = {
        type: function( value ) {
            return filterMarkerByPropertyObject('type', 'id', value);
        },
        city: function (value) {
            return filterMarkerByString('city', value);
        }
    }

    function filterMarkerByPropertyObject(dataProperty, dataObjectKey, value) {
        var items = [];

        var values = value.split(',').map(function(item) {
            return parseInt(item, 10);
        });

        for (var i=0; i < window.jsonData.length; i++) {
            var item = itemMap(window.jsonData[i]);

            if($.inArray(item[dataProperty][dataObjectKey], values) != -1) {
                items.push(window.jsonData[i]);
            } else {
                removeMarker(item.id);
            }
        }

        return items;
    }

    function filterMarkerByString(dataProperty, value) {
        var items = [];

        for (var i=0; i < window.jsonData.length; i++) {
            var item = itemMap(window.jsonData[i]);

            if(item[dataProperty] == value) {
                items.push(window.jsonData[i]);
            } else {
                removeMarker(item.id);
            }
        }

        return items;
    }


    return {
        init: init,
        filterMarker: filterMarker
    }
}();


$(function() {
    var mapConfig = {
        idSelector: 'map-canvas',
        inputAutoCompleteSelector: 'search-autocomplete'
    }

    mapApp.init( mapConfig );

    $('.checkbox-type').on('change', function() {
        var $checked = $('input[name=types]:checked');
        var checked = [];
        $checked.each(function (){
            checked.push($(this).val());
        });
        mapApp.filterMarker('type', checked);
    });

    $('#city').on('change', function() {
        var value = $(this).val();
        mapApp.filterMarker('city', value);
    });

});
