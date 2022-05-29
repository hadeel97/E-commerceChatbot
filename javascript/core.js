$(function() {

    var cart_ids = [];

    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var item = '<div class="reply"><img src="'+e.target.result+'" /></div>'
                $('.messages-holder').append(item)
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $('.attach-image input').on('change', function() {
        $('.attach-image').css('opacity','0.5')
        $(".attach-image i").removeClass('fa-picture-o')
        $(".attach-image i").addClass('fa-spinner')
        var file_data = $('#file').prop('files')[0];   
        var form_data = new FormData();                  
        form_data.append('file', file_data);   
        readURL(this);   
        setTimeout(function() {
            $(".display").scrollTop($(".display")[0].scrollHeight);
        }, 300)
        $.ajax({
            url: 'https://x0l127hq46.execute-api.eu-central-1.amazonaws.com/prod/hadile12', 
            dataType: 'json',  
            cache: false,
            contentType: false,
            processData: false,
            data: file_data,                         
            type: 'post',
            success: function(response){
               console.log(response);
               if(response['categoryList']) {
                   $(".categories-list ul").html("");
                    response['categoryList'].forEach(function(obj) { 
                        var item = "<li data-name='"+obj+"' data-img='"+response['imageURL']+"'>"+obj+"</li>";
                        $(".categories-list ul").append(item)
                    });
                    $('.attach-image').css('opacity','1')
                    $(".categories-list").show();
                    $(".display").scrollTop($(".display")[0].scrollHeight);
                    $(".no-product").hide();
                    $(".attach-image i").removeClass('fa-spinner')
                    $(".attach-image i").addClass('fa-picture-o')
                    
               }
            }
         });
    })

    $(".categories-list ul").on("click","li", function() {
        var category_name = $(this).attr('data-name');
        $(this).css("opacity","0.5")
        var list = [];
        $.ajax({
            url: 'https://x0l127hq46.execute-api.eu-central-1.amazonaws.com/prod/getproducts?filter_input='+category_name+'&filter_type=tag', 
            dataType: 'json',  
            cache: false,
            contentType: false,
            processData: false,                       
            type: 'get',
            success: function(response){
               if(response['data']['products']['edges']) {
                    var products = response['data']['products']['edges'];
                    products.forEach(function(pr) {
                        var isAvailable = pr['node']['variants']['edges'][0]['node']['availableForSale'];
                        if(pr['node']['variants']['edges'][0]['node']['image']) {
                            var img = pr['node']['variants']['edges'][0]['node']['image']['transformedSrc'];
                        }else {
                            var img = ""
                        }
                        var price = pr['node']['variants']['edges'][0]['node']['price'];
                        var link = pr['node']['onlineStoreUrl'];
                        var sizes = [];
                        pr['node']['variants']['edges'].forEach(function(size) {
                            sizes.push({"title" : size['node']['title'], "id" : size['node']['id']})
                        })
                        var obj = {"title" : pr['node']['title'], "image" : img, "price" : price, "link": link, "sizes" : sizes,"is_available": isAvailable};
                        list.push(obj)
                    }); 

                    var pr_list_item = '<div class="products-list"><p class="label">Products we found for you</p><ul>'
                    
                    list.forEach(function(item) {
                        var btn = "<p style='color:red' class='out-of-stock'>Out of Stock</p>";
                        if(item['is_available']) {
                            btn = "<button class='select-size'>Select Size</button>"
                        }
                        var pr_sizes = "";
                        item['sizes'].forEach(function(si) {
                            pr_sizes += "<span data-id='"+si['id']+"'>"+si['title']+"</span>";
                        })
                        var elem = "<li><img src='"+item['image']+"' /><h2>"+item['title']+"</h2><p>Price: "+item['price']+"</p><button class='view-product' data-link='"+item['link']+"'>View Product</button>"+btn+"<div class='sizes'>"+pr_sizes+"</div><p class='added-to-cart'>Added to cart</p></li>"
                        pr_list_item += elem;
                        
                    })
                    pr_list_item += '</ul></div>'
                    if(products.length > 0) {
                        $('.messages-holder').append(pr_list_item)
                        $(".categories-list").hide();
                    }else {
                        var item = '<div class="msg"><p>sorry we may not have this product available currently, please look for different product</p></div>'
                        $('.messages-holder').append(item)
                        $('.categories-list').hide();
                    }
                    $(".display").scrollTop($(".display")[0].scrollHeight);
               }
            }
         });
    })

    $(".messages-holder").on("click",".products-list ul li .view-product", function() {
        var link = $(this).attr('data-link')
        window.open(link, '_blank');
    })

    $(".messages-holder").on("click",".products-list ul li .select-size", function() {
        $(this).parent().find('.sizes').show();
        $(this).hide();
        $(this).parent().find('.view-product').hide();
    })

    $(".messages-holder").on("click",".products-list ul li .sizes span", function() {
        $(this).css("opacity","0.5")
        var id = $(this).attr('data-id');
        if(!cart_ids.includes(id)) {
            cart_ids.push(id)
        }
        console.log(cart_ids)
        var pr = $(this).parent().parent();
        $.ajax({
            url: 'https://x0l127hq46.execute-api.eu-central-1.amazonaws.com/prod/checkout?variant_id=' + cart_ids.toString(), 
            dataType: 'json',  
            cache: false,
            contentType: false,
            processData: false,                        
            type: 'get',
            success: function(response){
               if(response['variant_checkout_url']) {
                    pr.find('.sizes').hide();
                    pr.find('.added-to-cart').show();
                    $('.cart').attr('data-link', response['variant_checkout_url']);
                    $('.cart').show();
                    // $(".products-list").hide()
                    var item = '<div style="background:green" class="msg"><p>Product added to cart, Do you need something else ?</p></div>'
                    $('.messages-holder').append(item)
                    $(".display").scrollTop($(".display")[0].scrollHeight);
               }
            }
         });
    })

    $('.cart').click(function() {
        var link = $(this).attr('data-link')
        window.open(link, '_blank');
    })

    $('.send-msg').click(function() {
        if($(".msg-content").val() != "") {
            sendMessagetoBot()
        }
    })

    $(document).on('keypress',function(e) {
        if(e.which == 13) {
            if($(".msg-content").val() != "") {
                sendMessagetoBot()
            }
        }
    });

    function sendMessagetoBot() {
        var content = $(".msg-content").val();
        var item = '<div class="reply"><p>'+content+'</p></div>'
        $('.messages-holder').append(item)
        $(".display").scrollTop($(".display")[0].scrollHeight);
        $('.msg-content').val("")
        // $('.products-list').hide();
        $('.categories-list').hide();
        $.ajax({
            url: 'https://x0l127hq46.execute-api.eu-central-1.amazonaws.com/prod/nlpfunction?search_input=' + content, 
            dataType: 'json',  
            cache: false,
            contentType: false,
            processData: false,                        
            type: 'get',
            success: function(response){
                console.log(response)
                if(response['data']) {
                    var list = [];
                    var products = response['data']['products']['edges'];
                    products.forEach(function(pr) {
                        var isAvailable = pr['node']['variants']['edges'][0]['node']['availableForSale'];
                        if(pr['node']['variants']['edges'][0]['node']['image']) {
                            var img = pr['node']['variants']['edges'][0]['node']['image']['transformedSrc'];
                        }else {
                            var img = ""
                        }
                        var price = pr['node']['variants']['edges'][0]['node']['price'];
                        var link = pr['node']['onlineStoreUrl'];
                        var sizes = [];
                        pr['node']['variants']['edges'].forEach(function(size) {
                            sizes.push({"title" : size['node']['title'], "id" : size['node']['id']})
                        })
                        var obj = {"title" : pr['node']['title'], "image" : img, "price" : price, "link": link, "sizes" : sizes,"is_available": isAvailable};
                        list.push(obj)
                    }); 

                    var pr_list_item = '<div class="products-list"><p class="label">Products we found for you</p><ul>'
                    // $('.products-list ul').html("");
                    
                    list.forEach(function(item) {
                        var btn = "<p style='color:red' class='out-of-stock'>Out of Stock</p>";
                        if(item['is_available']) {
                            btn = "<button class='select-size'>Select Size</button>"
                        }
                        var pr_sizes = "";
                        item['sizes'].forEach(function(si) {
                            pr_sizes += "<span data-id='"+si['id']+"'>"+si['title']+"</span>";
                        })
                        var elem = "<li><img src='"+item['image']+"' /><h2>"+item['title']+"</h2><p>Price: "+item['price']+"</p><button class='view-product' data-link='"+item['link']+"'>View Product</button>"+btn+"<div class='sizes'>"+pr_sizes+"</div><p class='added-to-cart'>Added to cart</p></li>"
                        // $('.products-list ul').append(elem)
                        pr_list_item += elem;
                        
                    })
                    pr_list_item += '</ul></div>'
                    //$('.attach-image').hide();
                    if(products.length > 0) {
                        $('.messages-holder').append(pr_list_item)
                        // $(".products-list").show();
                        $(".categories-list").hide();
                    }else {
                    //  $(".no-product").show();
                        var item = '<div class="msg"><p>sorry we may not have this product available currently, please look for a different product</p></div>'
                        $('.messages-holder').append(item)
                        $('.categories-list').hide();
                    }
                    $(".display").scrollTop($(".display")[0].scrollHeight);
                }else if(response['message']) {
                    var bot_msg = response['message']
                    var item = '<div class="msg"><p>'+bot_msg+'</p></div>'
                    $('.messages-holder').append(item)
                    $(".display").scrollTop($(".display")[0].scrollHeight);
                }
            }
         });
    }

})