function cardProcess(userId, event) {
  const replyToken = event.replyToken;
  const message = createCarouselMessage();
  replyMessage(replyToken, message);
}

function createCarouselMessage() {
  const site1Card = {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical',
      contents: [{ type: 'text', text: '受付番号登録', weight: 'bold', size: 'md', color: '#1DB446' }]
    },
    hero: {
      type: 'box', layout: 'vertical',
      contents: [{
        type: 'image',
        url: 'https://drive.google.com/uc?export=download&id=1FIbnxYIszLCBmAQqwlRjp509W7iA8d5r',
        size: 'xl', aspectRatio: '4:3', aspectMode: 'cover', align: 'center', gravity: 'center'
      }]
    },
    body: {
      type: 'box', layout: 'vertical',
      contents: [
        { type: 'text', text: '中古新規・名義変更', weight: 'bold', size: 'xl', align: 'center', margin: 'lg' },
        { type: 'text', text: '受付番号を半角数字で入力してください', size: 'sm', wrap: true, align: 'center', margin: 'md', color: '#888888' }
      ]
    },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [] }
  };

  const site2Card = {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical',
      contents: [{ type: 'text', text: '受付番号登録', weight: 'bold', size: 'md', color: '#1DB446' }]
    },
    hero: {
      type: 'box', layout: 'vertical',
      contents: [{
        type: 'image',
        url: 'https://drive.google.com/uc?export=download&id=1FIbnxYIszLCBmAQqwlRjp509W7iA8d5r',
        size: 'xl', aspectRatio: '4:3', aspectMode: 'cover', align: 'center', gravity: 'center'
      }]
    },
    body: {
      type: 'box', layout: 'vertical',
      contents: [
        { type: 'text', text: '一般継続', weight: 'bold', size: 'xl', align: 'center', margin: 'lg' },
        { type: 'text', text: '受付番号を半角数字で入力してください', size: 'sm', wrap: true, align: 'center', margin: 'md', color: '#888888' }
      ]
    },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [] }
  };

  const cancelCard = {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical',
      contents: [{ type: 'text', text: 'キャンセル', weight: 'bold', size: 'md', color: '#1DB446' }]
    },
    hero: {
      type: 'box', layout: 'vertical',
      contents: [{
        type: 'image',
        url: 'https://drive.google.com/uc?export=download&id=1raDf2Kniagt69cBNoEUTdcrWu2z6p8gD',
        size: 'xl', aspectRatio: '4:3', aspectMode: 'cover', align: 'center', gravity: 'center'
      }]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md',
      contents: [
        { type: 'text', text: '通知を取り消す受付番号を選択してください。', weight: 'bold', size: 'md', wrap: true },
        { type: 'separator', margin: 'md' },
        {
          type: 'box', layout: 'vertical', spacing: 'sm',
          contents: [
            {
              type: 'box', layout: 'horizontal',
              contents: [
                { type: 'text', text: '中古新規・名義変更', weight: 'bold', size: 'sm', color: '#4A4A4A', flex: 3 },
                { type: 'text', text: '121', weight: 'bold', size: 'sm', color: '#007AFF', flex: 1 },
                { type: 'text', text: '番', size: 'sm', color: '#4A4A4A', flex: 0 }
              ]
            },
            {
              type: 'box', layout: 'horizontal',
              contents: [
                { type: 'text', text: '一般継続', weight: 'bold', size: 'sm', color: '#4A4A4A', flex: 3 },
                { type: 'text', text: '76, 444, 66, 13', weight: 'bold', size: 'sm', color: '#007AFF', flex: 1, wrap: true },
                { type: 'text', text: '番', size: 'sm', color: '#4A4A4A', flex: 0 }
              ]
            }
          ]
        },
        { type: 'text', text: '※上記にない場合は、番号を直接入力してください。', size: 'xs', color: '#888888', margin: 'md', wrap: true }
      ]
    }
  };

  return {
    type: 'flex',
    altText: '受付番号登録メニュー',
    contents: { type: 'carousel', contents: [site1Card, site2Card, cancelCard] }
  };
}
