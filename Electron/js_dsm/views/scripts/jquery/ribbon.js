(function( $ ){
    $.fn.ribbon = function(id) {
        if (!id) {
            if (this.attr('id')) {
                id = this.attr('id');
            }
        }
        
        var that = function() { 
            return thatRet;
        };
        
        var thatRet = that;
        
        that.selectedTabIndex = -1;
        
        var tabNames = [];
        
        that.goToBackstage = function() {
            ribObj.addClass('backstage');
        }
            
        that.returnFromBackstage = function() {
            ribObj.removeClass('backstage');
        }   
        var ribObj = null;
        
        that.init = function(id) {
            if (!id) {
                id = 'ribbon';
            }
        
            ribObj = $('#'+id);
            ribObj.find('.ribbon-window-title').after('<div id="ribbon-tab-header-strip"></div>');
            var header = ribObj.find('#ribbon-tab-header-strip');
            
            ribObj.find('.ribbon-tab').each(function(index) {
                var id = $(this).attr('id'); //this指找到的class为ribbon-tab的DOM对象；
                if (id == undefined || id == null)
                {
                    $(this).attr('id', 'tab-'+index);
                    id = 'tab-'+index;
                }
                tabNames[index] = id;
            
                var title = $(this).find('.ribbon-title'); //title为ribbon-tab中class为ribbon-title的DOM对象；
                var isBackstage = $(this).hasClass('file'); //看对应ribbon-tab是否有file属性,当前工具未使用到file属性；
                header.append('<div id="ribbon-tab-header-'+index+'" class="ribbon-tab-header"></div>'); //在新建的ribbon-tab-header-strip对象中添加ribbon-tab-header对象；
                var thisTabHeader = header.find('#ribbon-tab-header-'+index); //找到这个ribbon-tab-header对象；
                thisTabHeader.append(title); //将title对象添加到其中；
                if (isBackstage) {
                    thisTabHeader.addClass('file'); //给ribbon-tab-header对象也添加file属性；
                    
                    thisTabHeader.click(function() {
                        that.switchToTabByIndex(index); //单击时显示该页面；
                        that.goToBackstage(); //改变其file属性；
                    });
                } else {
                    if (that.selectedTabIndex==-1) {
                        that.selectedTabIndex = index; //默认选中第一个ribbon-tab-header;
                        thisTabHeader.addClass('sel'); //添加属性sel；
                    }
                    
                    thisTabHeader.click(function() {
                        that.returnFromBackstage();
                        that.switchToTabByIndex(index);
                    });
                }
                $(this).hide();
            });
            
            ribObj.find('.ribbon-button').each(function(index) {
                var title = $(this).find('.button-title');
                title.detach();
                $(this).append(title);  //将title元素移动到ribbon-button对象的末端；
                
                var el = $(this);
                
                this.enable = function() { 
                    el.removeClass('disabled'); 
                };
        
                this.disable = function() {
                    el.addClass('disabled');
                };
        
                this.isEnabled = function() {
                    return !el.hasClass('disabled');
                };
                                
                if ($(this).find('.ribbon-hot').length==0) { 
                    $(this).find('.ribbon-normal').addClass('ribbon-hot'); //ribbon-button中没有ribbon-hot属性的元素，则将其中ribbon-normal属性的元素全部增加ribbon-hot属性；
                };
        
                if ($(this).find('.ribbon-disabled').length==0) {
                    $(this).find('.ribbon-normal').addClass('ribbon-disabled');
                    $(this).find('.ribbon-normal').addClass('ribbon-implicit-disabled');
                };
                
                $(this).tooltip({
                    bodyHandler: function () {
                        if (!$(this).isEnabled()) { 
                            $('#tooltip').css('visibility', 'hidden');
                            return '';
                        }
                        
                        var tor = '';

                        if (jQuery(this).children('.button-help').size() > 0)
                            tor = (jQuery(this).children('.button-help').html());
                        else
                            tor = '';

                        if (tor == '') {
                            $('#tooltip').css('visibility', 'hidden');
                            return '';
                        }

                        $('#tooltip').css('visibility', 'visible');

                        return tor;
                    },
                    left: 0,
                    extraClass: 'ribbon-tooltip'
                });
            });
            
            ribObj.find('.ribbon-section').each(function(index) {
                $(this).after('<div class="ribbon-section-sep"></div>');
            });

            ribObj.find('div').attr('unselectable', 'on');
            ribObj.find('span').attr('unselectable', 'on');
            ribObj.attr('unselectable', 'on');

            that.switchToTabByIndex(that.selectedTabIndex);
        }
        
        that.switchToTabByIndex = function(index) {
            var headerStrip = $('#ribbon #ribbon-tab-header-strip');
            headerStrip.find('.ribbon-tab-header').removeClass('sel');
            headerStrip.find('#ribbon-tab-header-'+index).addClass('sel');

            $('#ribbon .ribbon-tab').hide();
            $('#ribbon #'+tabNames[index]).show();
        }
        
        $.fn.enable = function() {
            if (this.hasClass('ribbon-button')) {
                if (this[0] && this[0].enable) {
                    this[0].enable();
                }   
            }
            else {
                this.find('.ribbon-button').each(function() {
                    $(this).enable();
                });
            }               
        }            
                
        $.fn.disable = function() {
            if (this.hasClass('ribbon-button')) {
                if (this[0] && this[0].disable) {
                    this[0].disable();
                }   
            }
            else {
                this.find('.ribbon-button').each(function() {
                    $(this).disable();
                });
            }               
        }
    
        $.fn.isEnabled = function() {
            if (this[0] && this[0].isEnabled) {
                return this[0].isEnabled();
            } else {
                return true;
            }
        }    
    
        that.init(id);
    
        $.fn.ribbon = that;
    };
})( jQuery );

(function () {
    $('#ribbon').ribbon();
    
    /*
    $('#enable-btn').click(function() {
        $('#del-table-btn').enable();
        $('#del-page-btn').enable();
        $('#save-btn').enable();
        $('#other-btn-2').enable();
        
        $('#enable-btn').hide();
        $('#disable-btn').show();   
    });
    $('#disable-btn').click(function() {
        $('#del-table-btn').disable();
        $('#del-page-btn').disable();
        $('#save-btn').disable();
        $('#other-btn-2').disable();
        
        $('#disable-btn').hide();
        $('#enable-btn').show();    
    });
    
    
    $('.ribbon-button').click(function() {
        if (this.isEnabled()) {
            switch ($(this).attr('id')) {
                case 'ribbon-btn-export-as-excel':
                    console.log('abc');
                    break;
            }
        }
    });
    */
})();
