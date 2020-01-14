# WebArchives React版クライアント

[WebApchives](https://github.com/yuumi3/WebArchives) iOSアプリで収集した情報をWebで表示するReactアプリ

![ReactWebArichives](https://www.ey-office.com/images/react_web_archives.png)

## Build

* インストール

```sh
$ git clone git@github.com:yuumi3/react_web_archives.git
$ npm install
```

*  あなたのFirebaseアカウント情報を `src/firebaseConfig.ts` に設定して下さい。

```js
export default {
  apiKey: "XXXXXX",
  authDomain: "XXXXXX",
  databaseURL: "XXXXXX",
  projectId: "XXXXXX",
  storageBucket: "XXXXXX",
  messagingSenderId: "XXXXXX",
  appId: "XXXXXX"
}
```

* `npm start` コマンドを実行すると しばらくして `http://localhost:8080` にアプリが起動されます。
* 右上の `Login` ボタンを押して認証して下さい。
* `npm run build` コマンドでデプロイ可能なhtml,js等のファイルが `build/` ディレクトリー下に作成されます。



## License

[MIT License](http://www.opensource.org/licenses/MIT).