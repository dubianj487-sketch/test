function createAdminMenuMessage() {
  const cardDataList = [
    {
      title: 'システムバックアップ',
      text: '現在のスクリプトとスプレッドシートのデータを Google ドライブに安全に保存します。',
      imageUrl: 'https://drive.google.com/uc?export=download&id=1k0koxWkvCWpi5uHt4q_I79BNHjlfbJKI',
      buttonLabel: 'バックアップを実行',
      buttonActionType: 'message',
      buttonValue: 'backup'
    },
    {
      title: 'スクレイピングテスト',
      text: '対象サイトへの接続とデータの取得状況を手動でテストします。',
      imageUrl: 'https://drive.google.com/uc?export=download&id=1FIbnxYIszLCBmAQqwlRjp509W7iA8d5r',
      buttonLabel: 'テストを実行',
      buttonActionType: 'message',
      buttonValue: 'チェック'
    },
    {
      title: 'Scraping Manager Console',
      text: 'テスト環境にデプロイされている最新の Web アプリケーションを開きます。',
      imageUrl: 'https://drive.google.com/uc?export=download&id=1FIbnxYIszLCBmAQqwlRjp509W7iA8d5r',
      buttonLabel: 'アプリケーションを開く',
      buttonActionType: 'uri',
      buttonValue: 'https://script.google.com/macros/s/AKfycbyghKP_m2gpGcgoqlB8ycMec_iLErbqJ8NtvmlfXQzSeCjTw3DsUkcbmcRkXW28BcJ7/exec'
    },
    {
      title: 'コンポーネントプレビュー',
      text: 'ユーザーに配信されるメッセージカードとカルーセルのレイアウトを確認します。',
      imageUrl: 'https://drive.google.com/uc?export=download&id=1FIbnxYIszLCBmAQqwlRjp509W7iA8d5r',
      buttonLabel: 'プレビューを表示',
      buttonActionType: 'message',
      buttonValue: 'card'
    }
  ];

  const carouselContents = cardDataList.map(data => createBubbleComponent(data));

  return {
    type: 'flex',
    altText: '管理者メニュー',
    contents: { type: 'carousel', contents: carouselContents }
  };
}

function createBubbleComponent(data) {
  const buttonAction = {
    type: data.buttonActionType,
    label: data.buttonLabel
  };

  if (data.buttonActionType === 'uri') {
    buttonAction.uri = data.buttonValue;
  } else {
    buttonAction.text = data.buttonValue;
  }

  return {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical',
      contents: [{ type: 'text', text: '管理者メニュー', weight: 'bold', size: 'md', color: '#1DB446' }]
    },
    hero: {
      type: 'box', layout: 'vertical',
      contents: [{
        type: 'image', url: data.imageUrl,
        size: 'xl', aspectRatio: '4:3', aspectMode: 'cover'
      }]
    },
    body: {
      type: 'box', layout: 'vertical',
      contents: [
        { type: 'text', text: data.title, weight: 'bold', size: 'xl', align: 'center' },
        { type: 'text', text: data.text, size: 'sm', wrap: true, align: 'center', margin: 'md', color: '#888888' }
      ]
    },
    footer: {
      type: 'box', layout: 'vertical', spacing: 'sm',
      contents: [{ type: 'button', style: 'primary', action: buttonAction }]
    }
  };
}
