/*
 * jQuery OrgProc Plugin
 * https://github.com/dabeng/OrgProc
 *
 * Demos of jQuery OrgProc Plugin
 * http://dabeng.github.io/OrgProc/local-datasource/
 * http://dabeng.github.io/OrgProc/ajax-datasource/
 * http://dabeng.github.io/OrgProc/ondemand-loading-data/
 * http://dabeng.github.io/OrgProc/option-createNode/
 * http://dabeng.github.io/OrgProc/export-proc/
 * http://dabeng.github.io/OrgProc/integrate-map/
 *
 * Copyright 2016, dabeng
 * http://dabeng.github.io/
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
'use strict';

(function (factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    factory(require('jquery'), window, document);
  } else {
    factory(jQuery, window, document);
  }
}(function ($, window, document, undefined) {
  $.fn.proc = function (options) {
    var defaultOptions = {
      'nodeTitle': 'name',
      'nodeId': 'id',
      'nodeChildren': 'children',
      'toggleSiblingsResp': false,
      'depth': 999,
      'procClass': '',
      'exportButton': false,
      'exportFilename': 'OrgProc',
      'parentNodeSymbol': 'fa-users',
      'draggable': false,
      'direction': 't2b',
      'pan': false,
      'zoom': 1.0
    };

    var $procContainer = this;

    switch (options) {
      case 'getValue':
        return $procContainer.children('.ie-polyfill-container').data().options.data;
      default: // initiation time
        var opts = $.extend(defaultOptions, options);
    }

    $procContainer.addClass('dingflow-design');

    opts.reRender = function (newOptions) {
      if (newOptions) {
        opts = newOptions;
      }

      $procContainer.empty();
      
      var $zoomIn = $('<div class="zoom-in"></div>');
      var $zoomOut = $('<div class="zoom-out"></div>');
      var $zoom = $('<div class="zoom"></div>');
      $zoom.append($zoomOut);
      $zoom.append('<span>' + (opts.zoom * 100).toFixed(0) + '%</span>');
      $zoom.append($zoomIn);
      $procContainer.append($zoom);

      $zoomIn.on('click', function () {
        if (opts.zoom.toFixed(1) < 3) {
          opts.zoom += 0.1;
        }
        opts.reRender(opts);
      });

      $zoomOut.on('click', function () {
        if (opts.zoom.toFixed(1) > 0.5) {
          opts.zoom -= 0.1;
        }
        opts.reRender(opts);
      });

      renderProcess($procContainer, opts.data, opts);
    }

    opts.reRender();

    $procContainer.on('click', function (event) {
      var isPopover = $(event.target).closest($('div.add-node-popover-body')).length > 0;
      if (!isPopover) {
        for (var i = 0; i < $procContainer.children().length; i++) {
          if (i > 1) {
            $procContainer.children().eq(i).hide();
          }
        }
      }
      $('.auto-judge').removeClass('active');
      $('.node-wrap-box').removeClass('active');
    });

    if ($('#SIDE_MODAL').length === 0) {
      $('body').append('<div id="SIDE_MODAL"></div>');
    }

    return $procContainer;
  };

  function renderProcess($procContainer, processData, opts) {
    console.log('flow re-render')
    console.log(processData)

    var $proc = $('<div></div>', {
      'data': { 'options': opts },
      'class': 'ie-polyfill-container'
    });
    $procContainer.append($proc);

    var $boxScale = $('<div class="box-scale" id="box-scale" style="transform: scale(' + opts.zoom + '); transform-origin: 50% 0px 0px;"></div>');
    $proc.append($boxScale);

    renderNode($boxScale, processData, opts)
    renderEndNode($boxScale, opts)
  }

  function renderNode($parentNode, nodeData, opts) {
    var $node = $('<div class="node-wrap" id="node_' + nodeData.nodeId + '"></div>');
    $parentNode.append($node);
    var $nodeBox = $('<div class="node-wrap-box node_' + nodeData.nodeId + '"></div>');
    $node.append($nodeBox);
    if (nodeData.type === 'start') {
      $nodeBox.addClass('start-node');
    }
    var $div = $('<div></div>');
    $nodeBox.append($div);

    $nodeBox.on('click', function (event) {
      event.stopPropagation();
      $('.node-wrap-box').removeClass('active');
      $nodeBox.addClass('active');
  });

    var $title = $('<div class="title"></div>');
    $div.append($title);
    var $content = $('<div class="content"></div>');
    $div.append($content);
    var $closeIcon = $('<i aria-label="icon: close" tabindex="-1" class="anticon anticon-close close"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path></svg></i>');
    var title = '';
    switch (nodeData.type) {
      case 'start':
        $title.css('background', 'rgb(87, 106, 149)');
        $title.append('<span class="">' + (nodeData.name && nodeData.name !== 'UNKNOWN' ? nodeData.name : '提交人') + '</span>');
        $content.append('<div class="text">提交人</div>');
        $content.on('click', opts.onClickStart ? opts.onClickStart : function () {
          console.log('onClickStart', nodeData.nodeId);
          popModal(nodeData, opts);
        });
        break;
      case 'approver':
        $title.css('background', 'rgb(255, 148, 62)');
        $title.append('<span class="iconfont"></span>');
        title = nodeData.name && nodeData.name !== 'UNKNOWN' ? nodeData.name : '审批人';
        var $editTitle = $('<span class="editable-title" data-placeholder="审批人">' + title + '</span>');
        $title.append($editTitle);
        $editTitle.on('click', onEditTitleClick);
        $title.append($closeIcon);
        $content.append('<div class="text"><span class="placeholder">请选择审批人</span></div>');
        $content.on('click', opts.onClickApprover ? opts.onClickApprover : function () {
          console.log('onClickApprover', nodeData.nodeId);
          popModal(nodeData, opts);
        });
        break;
      case 'notifier':
        $title.css('background', 'rgb(50, 150, 250)');
        $title.append('<span class="iconfont"></span>');
        title = nodeData.name && nodeData.name !== 'UNKNOWN' ? nodeData.name : '抄送人';
        var $editTitle = $('<span class="editable-title" data-placeholder="抄送人">' + title + '</span>');
        $title.append($editTitle);
        $editTitle.on('click', onEditTitleClick);
        $title.append($closeIcon);
        $content.append('<div class="text"><span class="placeholder">请选择抄送人</span></div>');
        $content.on('click', opts.onClickNotifier ? opts.onClickNotifier : function () {
          console.log('onClickNotifier', nodeData.nodeId);
          popModal(nodeData, opts);
        });
        break;
      case 'audit':
        $title.css('background', 'rgb(251, 96, 45)');
        $title.append('<i class="anticon node-view-icon audit"><svg class="" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><defs><style>@font-face{font-family:element-icons;src:url(chrome-extension://moombeodfomdpjnpocobemoiaemednkg/fonts/element-icons.woff) format(&amp;quot;woff&amp;quot;),url(&amp;quot;chrome-extension://moombeodfomdpjnpocobemoiaemednkg/fonts/element-icons.ttf &amp;quot;) format(&amp;quot;truetype&amp;quot;)}</style></defs><path d="M746.667 85.333a128 128 0 01128 128v140.8L576.555 652.31a20.373 20.373 0 00-2.134 26.283l2.134 2.517 43.2 43.2a20.373 20.373 0 0026.282 2.134l2.518-2.134 226.112-226.176v312.534a128 128 0 01-128 128H277.333a128 128 0 01-128-128V213.333a128 128 0 01128-128h469.334zM545.856 696.747a20.373 20.373 0 00-24.981 8.362l-38.784 75.862a10.176 10.176 0 0010.965 13.866l2.261-.64 93.27-16.917a20.373 20.373 0 008.96-30.784l-2.134-2.539-42.709-42.709a20.373 20.373 0 00-6.827-4.523zm-93.013-225.494H332.608a40.747 40.747 0 00-4.16 81.28l4.16.214h120.235a40.747 40.747 0 004.16-81.28l-4.16-.214zM615.765 349.1H332.587a40.747 40.747 0 00-4.16 81.237l4.16.213h283.157a40.747 40.747 0 004.16-81.258l-4.16-.214zm0-122.198H332.587a40.747 40.747 0 00-4.16 81.259l4.16.213h283.157a40.747 40.747 0 004.16-81.258l-4.16-.214z" fill="#FB602D"></path></svg></i>');
        title = nodeData.name && nodeData.name !== 'UNKNOWN' ? nodeData.name : '办理人';
        var $editTitle = $('<span class="editable-title" data-placeholder="办理人">' + title + '</span>');
        $title.append($editTitle);
        $editTitle.on('click', onEditTitleClick);
        $title.append($closeIcon);
        $content.append('<div class="text"><span class="placeholder">请选择办理人</span></div>');
        $content.on('click', opts.onClickAudit ? opts.onClickAudit : function () {
          console.log('onClickAudit', nodeData.nodeId);
          popModal(nodeData, opts);
        });
        break;
      default:
        break;
    }
    $content.append('<i aria-label="icon: right" class="anticon anticon-right arrow"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="right" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z"></path></svg></i>');

    renderAddBtn($node, nodeData, opts)

    if (nodeData.childNode) {
      if (nodeData.childNode.type === 'route') {
        renderBranch($parentNode, nodeData.childNode, opts);
      } else {
        renderNode($parentNode, nodeData.childNode, opts);
      }
    }
  }

  function renderBranch($parentNode, nodeData, opts) {
    var $branch = $('<div class="branch-wrap"></div>');
    $parentNode.append($branch);
    var $branchBoxWrap = $('<div class="branch-box-wrap" id="node_' + nodeData.nodeId + '"></div>');
    $branch.append($branchBoxWrap);
    var $branchBox = $('<div class="branch-box"></div>');
    $branchBoxWrap.append($branchBox);
    var $addRouteBtn = $('<button class="add-branch">添加条件</button>');
    $branchBox.append($addRouteBtn);

    $addRouteBtn.on('click', opts.onAddRoute ? opts.onAddRoute : function() {
      console.log('onAddRoute', nodeData.nodeId);
      nodeData.conditionNodes.push({
        "name": "条件" + (nodeData.conditionNodes.length + 1),
        "type": "condition",
        "prevId": nodeData.nodeId,
        "nodeId": getRandomId(),
        "properties": {
          "conditions": []
        }
      });
      opts.reRender();
    });

    nodeData.conditionNodes.forEach((node, index) => {
      var $node = $('<div class="col-box"></div>');
      $branchBox.append($node);

      if (index === 0) {
        $node.append('<div class="top-left-cover-line"></div>');
        $node.append('<div class="bottom-left-cover-line"></div>');
      }
      var $conditionNode = $('<div class="condition-node"></div>');
      $node.append($conditionNode);
      var $conditionNodeBox = $('<div class="condition-node-box" id="node_' + node.nodeId + '"></div>');
      $conditionNode.append($conditionNodeBox);
      if (index === nodeData.conditionNodes.length - 1) {
        $node.append('<div class="top-right-cover-line"></div>');
        $node.append('<div class="bottom-right-cover-line"></div>');
      }

      var $judge = $('<div class="auto-judge node_' + node.nodeId + '"></div>');
      $conditionNodeBox.append($judge);
      if (index > 0) {
        var $sortLeft = $('<div class="sort-left"></div>');
        $sortLeft.append('<svg class="svg-icon left" viewBox="0 0 1024 1024" width="1em" height="1em"><defs><style></style></defs><path d="M403.046 529.203l373.863-373.76a27.955 27.955 0 000-39.629l-39.527-39.628a27.955 27.955 0 00-39.628 0L264.602 509.338a27.955 27.955 0 000 39.628l433.152 433.152a27.814 27.814 0 0039.628 0l39.527-39.526a27.955 27.955 0 000-39.526l-373.76-373.863z"></path></svg>');
        $judge.append($sortLeft);
        $sortLeft.on('click', function (event) {
          event.stopPropagation();
          var tempNode = nodeData.conditionNodes[index - 1];
          nodeData.conditionNodes.splice(index - 1, 1 , nodeData.conditionNodes[index]);
          nodeData.conditionNodes.splice(index, 1, tempNode);
          opts.reRender();
        });
      }
      var $title = $('<div class="title-wrapper"></div>');
      $judge.append($title);
      $title.append('<span class="editable-title">' + node.name + '</span>');
      $title.append('<span class="priority-title">优先级</span>');
      var $copyBtn = $('<svg class="svg-icon copy" viewBox="0 0 1024 1024" width="1em" height="1em"><defs><style></style></defs><path d="M637.873 157.538c60.731 0 110.829 47.262 110.829 106.496v576.119c0 55.768-44.348 100.824-100.274 105.944l-10.555.552H160.532c-60.81 0-110.907-47.262-110.907-106.496V264.034c0-59.313 50.097-106.496 110.828-106.496h477.341zm0 68.924H160.532c-23.631 0-41.984 17.329-41.984 37.572v576.119c0 20.243 18.353 37.573 41.905 37.573h477.341c23.631 0 41.984-17.33 41.984-37.573V264.034c0-20.322-18.353-37.572-41.905-37.572zM834.796 0c60.731 0 110.829 47.262 110.829 106.496v576.118c0 59.235-50.098 106.496-110.829 106.496a34.422 34.422 0 01-6.222-68.372l6.222-.55c23.631 0 41.906-17.33 41.906-37.574V106.496c0-20.322-18.354-37.573-41.906-37.573H357.455c-21.032 0-37.81 13.627-41.354 30.956l-.63 6.617a34.422 34.422 0 11-68.923 0C246.548 47.183 296.645 0 357.376 0h477.342zM426.772 491.284a43.323 43.323 0 010 86.646H253.479a43.323 43.323 0 010-86.646h173.293zm86.646-173.293a43.323 43.323 0 010 86.647H253.479a43.323 43.323 0 010-86.647h259.939z"></path></svg>');
      $title.append($copyBtn);
      var $closeBtn = $('<svg class="svg-icon close" viewBox="0 0 1024 1024" width="1em" height="1em"><defs><style></style></defs><path d="M512 451.67L768.427 195.2a42.667 42.667 0 1160.373 60.33L572.31 512 828.8 768.427a42.667 42.667 0 11-60.33 60.373L512 572.31 255.573 828.8a42.667 42.667 0 11-60.373-60.33L451.69 512 195.2 255.573a42.667 42.667 0 1160.33-60.373L512 451.69z"></path></svg>');
      $title.append($closeBtn);
      if (index < nodeData.conditionNodes.length - 1) {
        var $sortRight = $('<div class="sort-right"></div>');
        $sortRight.append('<svg class="svg-icon right" viewBox="0 0 1024 1024" width="1em" height="1em"><defs><style></style></defs><path d="M638.362 529.203l-373.76-373.76a27.955 27.955 0 010-39.629l39.526-39.628a27.955 27.955 0 0139.629 0l433.152 433.152a27.955 27.955 0 010 39.628L343.757 982.118a27.955 27.955 0 01-39.629 0l-39.629-39.526a27.955 27.955 0 010-39.526l373.863-373.863z"></path></svg>');
        $judge.append($sortRight);
        $sortRight.on('click', function (event) {
          event.stopPropagation();
          var tempNode = nodeData.conditionNodes[index + 1];
          nodeData.conditionNodes.splice(index + 1, 1 , nodeData.conditionNodes[index]);
          nodeData.conditionNodes.splice(index, 1, tempNode);
          opts.reRender();
        });
      }

      renderAddBtn($conditionNodeBox, node, opts)

      if (node.childNode) {
        if (node.childNode.type === 'route') {
          renderBranch($node, node.childNode, opts);
        } else {
          renderNode($node, node.childNode, opts);
        }
      }
      
      $copyBtn.on('click', function (event) {
        event.stopPropagation();
        var copyNode = $.extend(true, {}, node);
        copyNode.name += '（复制）';
        updateNodeId(copyNode);
        nodeData.conditionNodes.splice(index + 1, 0, copyNode);
        opts.reRender();
      });
      
      $closeBtn.on('click', function (event) {
        event.stopPropagation();
        nodeData.conditionNodes.splice(index, 1);
        if (nodeData.conditionNodes.length <= 1) {
          var tempChildNode = nodeData.childNode;
          if (tempChildNode) {
            moveNodeToBottom(nodeData.conditionNodes[0].childNode, tempChildNode);
          }
          if (nodeData.conditionNodes[0].childNode) {
            nodeData.conditionNodes[0].childNode.prevId = nodeData.prevId;
            updateParentNode(opts.data, nodeData.conditionNodes[0].childNode);
          } else {
            updateParentNode(opts.data, nodeData.prevId);
          }
        }
        opts.reRender();
      });

      $judge.on('click', function (event) {
        event.stopPropagation();
        $('.auto-judge').removeClass('active');
        $judge.addClass('active');
        popModal(nodeData, opts);
      });
    });

    renderAddBtn($branchBoxWrap, nodeData, opts)

    if (nodeData.childNode) {
      if (nodeData.childNode.type === 'route') {
        renderBranch($parentNode, nodeData.childNode, opts);
      } else {
        renderNode($parentNode, nodeData.childNode, opts);
      }
    }
  }

  function renderEndNode($parentNode) {
    $parentNode.append('<div class="end-node"><div class="end-node-circle"></div><div class="end-node-text">流程结束</div></div>');
  }

  function renderAddBtn($parentNode, nodeData, opts) {
    var $addNode = $('<div class="add-node-btn"></div>');
    $parentNode.append($addNode);
    var $addBtn = $('<button class="btn" type="button"><span class="iconfont"></span></button>');
    $addNode.append($addBtn);
    $addBtn.on('click', function(event) {
      if ($('#pop_' + nodeData.nodeId).css('display') === 'none') {
        setTimeout(() => {
          $('#pop_' + nodeData.nodeId).show();
        }, 100);
      } else {
        var $approver = $('<a class="add-node-popover-item approver"><div class="item-wrapper"><span class="iconfont"></span></div><span>审批人</span></a>');
        var $notifier = $('<a class="add-node-popover-item notifier"><div class="item-wrapper"><span class="iconfont"></span></div><span>抄送人</span></a>');
        var $audit = $('<a class="add-node-popover-item audit"><div class="item-wrapper"><svg class="svg-icon" viewBox="0 0 1024 1024" width="1em" height="1em"><defs><style>@font-face{font-family:element-icons;src:url(chrome-extension://moombeodfomdpjnpocobemoiaemednkg/fonts/element-icons.woff) format(&amp;quot;woff&amp;quot;),url(&amp;quot;chrome-extension://moombeodfomdpjnpocobemoiaemednkg/fonts/element-icons.ttf &amp;quot;) format(&amp;quot;truetype&amp;quot;)}</style></defs><path d="M746.667 85.333a128 128 0 01128 128v140.8L576.555 652.31a20.373 20.373 0 00-2.134 26.283l2.134 2.517 43.2 43.2a20.373 20.373 0 0026.282 2.134l2.518-2.134 226.112-226.176v312.534a128 128 0 01-128 128H277.333a128 128 0 01-128-128V213.333a128 128 0 01128-128h469.334zM545.856 696.747a20.373 20.373 0 00-24.981 8.362l-38.784 75.862a10.176 10.176 0 0010.965 13.866l2.261-.64 93.27-16.917a20.373 20.373 0 008.96-30.784l-2.134-2.539-42.709-42.709a20.373 20.373 0 00-6.827-4.523zm-93.013-225.494H332.608a40.747 40.747 0 00-4.16 81.28l4.16.214h120.235a40.747 40.747 0 004.16-81.28l-4.16-.214zM615.765 349.1H332.587a40.747 40.747 0 00-4.16 81.237l4.16.213h283.157a40.747 40.747 0 004.16-81.258l-4.16-.214zm0-122.198H332.587a40.747 40.747 0 00-4.16 81.259l4.16.213h283.157a40.747 40.747 0 004.16-81.258l-4.16-.214z" fill="#FB602D"></path></svg></div><span>办理</span></a>');
        var $route = $('<a class="add-node-popover-item route"><div class="item-wrapper"><span class="iconfont"></span></div><span>条件分支</span></a>');
        var $popover = $('<div class="ant-popover add-node-wrapper ant-popover-placement-rightTop" style="left: ' + ($(this).offset().left + 40) + 'px; top: ' + $(this).offset().top + 'px; transform-origin: -4px 0px;"><div class="ant-popover-content"><div class="ant-popover-arrow"></div><div class="ant-popover-inner" role="tooltip"><div><div class="ant-popover-inner-content"><div class="add-node-popover"><div class="add-node-popover-body"></div></div></div></div></div></div></div>');
        $popover.find('div.add-node-popover-body').append($approver).append($notifier).append($audit).append($route);
        var $popContainer = $('<div id="pop_' + nodeData.nodeId + '" style="position: absolute; top: 0px; left: 0px; width: 100%;"><div>');
        $popContainer.children('div').append($popover);
        setTimeout(() => {
          $(event.target).closest($('div.dingflow-design')).append($popContainer);
        }, 100);
        $approver.on('click', opts.onAddApprover ? opts.onAddApprover : function() {
          console.log('onAddApprover', nodeData.nodeId);
          addNode(nodeData, nodeData.nodeId, 'approver');
          opts.reRender();
        });
        $notifier.on('click', opts.onAddNotifier ? opts.onAddNotifier : function() {
          console.log('onAddNotifier', nodeData.nodeId);
          addNode(nodeData, nodeData.nodeId, 'notifier');
          opts.reRender();
        });
        $audit.on('click', opts.onAddAudit ? opts.onAddAudit : function() {
          console.log('onAddAudit', nodeData.nodeId);
          addNode(nodeData, nodeData.nodeId, 'audit');
          opts.reRender();
        });
        $route.on('click', opts.onAddRoute ? opts.onAddRoute : function() {
          console.log('onAddRoute', nodeData.nodeId);
          addNode(nodeData, nodeData.nodeId, 'route');
          opts.reRender();
        });
      }
    });
  }

  function addNode(nodeData, parentNodeId, type) {
    if (typeof nodeData === 'object') {
      if (nodeData.nodeId === parentNodeId) {
        if (type === 'route') {
          var nodeId = getRandomId();
          var tempNode = nodeData.childNode;
          nodeData.childNode = {
            'type': type,
            'prevId': parentNodeId,
            'nodeId': nodeId,
            'properties': {},
            'conditionNodes': [{
              "name": "条件1",
              "type": "condition",
              "prevId": nodeId,
              "nodeId": getRandomId(),
              "properties": {
                "conditions": []
              }
            }, {
              "name": "条件2",
              "type": "condition",
              "prevId": nodeId,
              "nodeId": getRandomId(),
              "properties": {
                "conditions": []
              }
            }]
          }
          if (tempNode) {
            tempNode.prevId = nodeData.childNode.conditionNodes[0].nodeId;
            nodeData.childNode.conditionNodes[0].childNode = tempNode;
          }
        } else {
          var nodeId = getRandomId();
          var tempNode = nodeData.childNode;
          nodeData.childNode = {
            'name': 'UNKNOWN',
            'type': type,
            'prevId': parentNodeId,
            'nodeId': nodeId,
            'properties': {}
          }
          if (tempNode) {
            tempNode.prevId = nodeId;
            nodeData.childNode.childNode = tempNode;
          }
        }
      } else {
        if (nodeData.type === 'route') {
          for (let i = 0; i < nodeData.conditionNodes.length; i++) {
            addNode(nodeData.conditionNodes[i], parentNodeId, nodeId, type);
          }
        }
        addNode(nodeData.childNode, parentNodeId, nodeId, type);
      }
    }
    return nodeData;
  }

  function popModal(nodeData, opts) {
    var $modalWrapper = $('<div class="side-modal-wrapper"></div>');
    var $modalMask = $('<div class="side-modal-mask"></div>');
    var $modal = $('<div class="side-modal"></div>');
    var $modalHeader = $('<div class="side-modal-header"></div>');
    var $modalBody = $('<div class="side-modal-body"></div>');
    var $modalFooter = $('<div class="side-modal-footer"></div>');
    var $cancelBtn = $('<button type="button" class="ant-btn ant-btn-default"><span>取 消</span></button>');
    var $saveBtn = $('<button type="button" class="ant-btn ant-btn-primary"><span>保 存</span></button>');
    $('#SIDE_MODAL').append($modalWrapper);
    $modalWrapper.append($modalMask);
    $modalWrapper.append($modal);
    $modal.append($modalHeader);
    $modal.append($modalBody);
    $modal.append($modalFooter);
    $modalFooter.append($cancelBtn);
    $modalFooter.append($saveBtn);

    if (nodeData.type === 'route') {
      $modalHeader.append('<div class="ant-row-flex ant-row-flex-middle editable-text-field"></div>');
      var $modalTitleCol = $('<div class="ant-col ant-col-17 editable-text-col"></div>');
      $modalHeader.find('.editable-text-field').append($modalTitleCol);
      var $modalTitle = $('<span class="text-value-wrapper"></span>');
      $modalTitle.append('<span>' + nodeData.name + '</span>');
      $modalTitle.append('<i aria-label="icon: edit" tabindex="-1" class="anticon anticon-edit"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="edit" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"></path></svg></i>');
      $modalTitleCol.append($modalTitle);
      $modalTitle.on('click', function (event) {
        event.stopPropagation();
        $modalHeader.find('.editable-text-col').empty();
        $modalHeader.find('.editable-text-col').append('<input placeholder="条件" type="text" class="ant-input" value="' + nodeData.name + '">');
      });
      var $modalPriorityCol = $('<div class="ant-col ant-col-7"></div>');
      $modalHeader.find('.editable-text-field').append($modalPriorityCol);
      var $modalPriority = $('<span class="priority-text-wrapper"><div class="priority-select ant-select ant-select-enabled"><div class="ant-select-selection ant-select-selection--single" role="combobox" aria-autocomplete="list" aria-haspopup="true" aria-controls="e4c42da8-7adb-4ad4-92be-7311ee4b3f80" aria-expanded="false" tabindex="0"><div class="ant-select-selection__rendered"><div class="ant-select-selection-selected-value" title="" style="display: block; opacity: 1;">优先级2</div></div><span class="ant-select-arrow" unselectable="on" style="user-select: none;"><i aria-label="icon: down" class="anticon anticon-down ant-select-arrow-icon"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path></svg></i></span></div></div><i aria-label="icon: info-circle" class="anticon anticon-info-circle date-tip"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="info-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path></svg></i></span>');
      $modalPriorityCol.append($modalPriority);
    } else {
      $modalHeader.append('<div class="ant-row-flex ant-row-flex-middle editable-text-field"><div class="ant-col ant-col-24 editable-text-col"></div></div>');
      var $modalTitle = $('<span class="text-value-wrapper"></span>');
      $modalHeader.find('.editable-text-col').append($modalTitle);
      if (nodeData.type === 'start') {
        $modalTitle.addClass('disabled').append('<span>提交人</span>');
      } else {
        $modalTitle.append('<span>' + nodeData.name + '</span>');
        $modalTitle.append('<i aria-label="icon: edit" tabindex="-1" class="anticon anticon-edit"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="edit" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"></path></svg></i>');
        $modalTitle.on('click', function (event) {
          event.stopPropagation();
          $modalHeader.find('editable-text-col').empty();
          switch (nodeData.type) {
            case 'approver':
              $modalHeader.find('.editable-text-col').append('<input placeholder="审批人" type="text" class="ant-input" value="' + nodeData.name + '">');
              break;
            case 'notifier':
              $modalHeader.find('.editable-text-col').append('<input placeholder="抄送人" type="text" class="ant-input" value="' + nodeData.name + '">');
              break;
            case 'audit':
              $modalHeader.find('.editable-text-col').append('<input placeholder="办理人" type="text" class="ant-input" value="' + nodeData.name + '">');
              break;
          }
        });
      }
    }

    $cancelBtn.on('click', function () {
      closeModal();
    });

    $saveBtn.on('click', function () {
      if (opts.save) {
        opts.save();
      }
      closeModal();
    });

    $modalMask.on('click', function () {
      closeModal();
    });
  }

  function closeModal() {
    $('#SIDE_MODAL').empty();
  }

  function onEditTitleClick() {
    var title = $(this).html();
    var placeholder = $(this).attr('data-placeholder');
    var $editTitleInput = $('<input class="ant-input editable-title-input" placeholder="' + placeholder + '" type="text" value="' + title + '">');
    $(this).replaceWith($editTitleInput);
    $editTitleInput.focus();
    $editTitleInput.on('blur', onEditTitleInputBlur);
  }

  function onEditTitleInputBlur() {
    var title = $(this).val();
    var placeholder = $(this).attr('placeholder');
    var $editTitle = $('<span class="editable-title" data-placeholder="' + placeholder + '">' + title + '</span>');
    $(this).replaceWith($editTitle);
    $editTitle.on('click', onEditTitleClick);
  }

  function moveNodeToBottom(node, childNode) {
    if (node.childNode) {
      moveNodeToBottom(node.childNode, childNode);
    } else {
      node.childNode = childNode;
    }
  }

  function updateParentNode(nodeData, node) {
    if (typeof node === 'string') {
      if (nodeData.nodeId === node) {
        nodeData.childNode = undefined;
      } else {
        if (nodeData.conditionNodes) {
          nodeData.conditionNodes.forEach((conditionNode) => {
            updateParentNode(conditionNode, node);
          })
        }
        if (nodeData.childNode) {
          updateParentNode(nodeData.childNode, node);
        }
      }
    } else {
      if (nodeData.nodeId === node.prevId) {
        nodeData.childNode = node;
      } else {
        if (nodeData.conditionNodes) {
          nodeData.conditionNodes.forEach((conditionNode) => {
            updateParentNode(conditionNode, node);
          })
        }
        if (nodeData.childNode) {
          updateParentNode(nodeData.childNode, node);
        }
      }
    }
  }

  function updateNodeId(node) {
    node.nodeId = getRandomId();
    if (node.conditionNodes) {
      node.conditionNodes.forEach((conditionNode) => {
        updateNodeId(conditionNode);
      })
    }
    if (node.childNode) {
      updateNodeId(node.childNode);
    }
  }

  function getRandomId() {
    var sign = '0123456789abcdefghijklmnopqrstuvwxyz';
    var id = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) {
        id += '_';
      }
      id += sign[Math.floor(Math.random()*36)];
    }
    return id;
  }
}));
