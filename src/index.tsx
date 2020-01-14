import React, {useEffect, useState, useRef} from 'react'
import ReactDOM from 'react-dom'
import firebase from 'firebase/app'
import "firebase/auth"
import "firebase/firestore"
import "firebase/storage"
import { FirebaseAuthProvider, useFirebaseAuth, SIGNIN_PROVIDERS } from "use-firebase-auth"
import config from "./firebaseConfig"
import useComponentSize from '@rehooks/component-size'
import fecha from 'fecha'

import 'react-virtualized/styles.css'
import {List, ListRowProps} from 'react-virtualized'
import styled from 'styled-components'

import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import Grid from '@material-ui/core/Grid'

interface Artcle {
  title: string
  created_at: firebase.firestore.Timestamp
  thumb: firebase.firestore.Blob
  pdf?: string
  url: string
}


firebase.initializeApp(config)



const App: React.FC = () => {
  const auth = useFirebaseAuth()
  const [artcles, setArticles] = useState<Artcle[]>([])
  const [loading, setLoading] = useState(false)
  const [contentURL, setContentURL] = useState<string|null>(null)
  const [contentTitle, setContentTitle] = useState<string>('')
  const [noPdf, setNoPdf] = useState(false)
  const pdfViewEl = useRef(null)
  const listViewEl = useRef(null)


  const loadArticles = async () => {
    const db = firebase.firestore()
    setLoading(true)
    const querySnapshot = await db.collection("articles").orderBy("created_at", "desc").get()
    const articles = querySnapshot.docs.map(e => e.data() as Artcle)
    setArticles(articles)
    setLoading(false)
  }

  const loadContent = async (article: Artcle) => {
    const storage = firebase.storage()
    let url = article.url
    if (article.pdf) {
      setLoading(true)
      setNoPdf(false)
      setContentTitle(article.title)
      url = await storage.ref().child(article.pdf).getDownloadURL()
      if (url === contentURL) setLoading(false)
    } else {
      setNoPdf(true)
    }
    setContentURL(url)
  }

  const screenHeight = window.innerHeight
  const pdfViewSize  = useComponentSize(pdfViewEl)
  const listViewSize = useComponentSize(listViewEl)

  useEffect(() => {
    auth.user && loadArticles()
  }, [auth.user])

  return (
    <>
      <TopBar loading={loading} error={auth.error}/>
      <Grid container spacing={2}>
        <Grid item xs={3} ref={listViewEl}>
          <ArctcleList artcles={artcles} listWidth={listViewSize.width} listHeight={screenHeight} clicked={(artcle) => loadContent(artcle)}/>
        </Grid>
        <Grid item xs={9} ref={pdfViewEl}>
          {contentURL && <ShowContent url={contentURL} title={contentTitle} noPdf={noPdf} pdfWidth={pdfViewSize.width} pdfHeight={screenHeight}
            loaded={() => setLoading(false)} />}
        </Grid>
      </Grid>
    </>
  )
}

type TopBarProps = {
  loading: boolean
  error: firebase.FirebaseError|null|undefined
}
const TopBar: React.FC<TopBarProps> = ({loading, error}) => {
  const Progress = styled(CircularProgress)`margin-right: 10px`
  const Title = styled(Typography)`flex-grow: 1`

  return (
    <AppBar position="static">
      <Toolbar>
        {loading && <Progress color="inherit" size={25}/>}
        <Title variant="h6">
          WebArchive {error && error.message}
        </Title>
        <FirebaseAuth/>
      </Toolbar>
    </AppBar>
  )
}

const FirebaseAuth: React.FC = () => {
  const { user, signInWithProvider, signOut } = useFirebaseAuth()
  if (user) {
    return <Button color="inherit" style={{textTransform: 'none'}} onClick={() => signOut()}> Logout </Button>
  } else {
    return <Button color="inherit" style={{textTransform: 'none'}} onClick={() => signInWithProvider(SIGNIN_PROVIDERS.GOOGLE)}> Login </Button>
  }
}

type ArctcleListProps = {
  artcles: Artcle[]
  listWidth: number
  listHeight: number
  clicked: (artcle: Artcle) => void
}
const ArctcleList: React.FC<ArctcleListProps> = ({artcles, listWidth, listHeight, clicked}) => {
  const [selectedIx, setSelectedIx] = useState(-1)

  const listRowHeight = 80

  const rowRenderer = ({ index,  key, style }: ListRowProps) => {
    const toYMD = (ts:firebase.firestore.Timestamp): string =>
      fecha.format(ts.toDate(), 'YYYY-MM-DD')
    const blobToImage = (blob: firebase.firestore.Blob): string =>
      blob ? "data:image/png;base64," + blob.toBase64() : ""

    const ArticleRow = styled.div`
      position: absolute; left: 0; top: ${style.top}px;
      width: ${listWidth - 20}px;  height: ${listRowHeight}px;
      border: solid 0.5px #888
      display: grid;
      grid-template-rows: 60px 20px;
      grid-template-columns: 72px 1fr;
      `
    const Thumb = styled.img`
      grid-row: 1 / 3;
      grid-column: 1 / 2;
      margin: ${(listRowHeight - 60) / 2}px 4px;
      height: 60px; max-width: 60px;
      `
    const Title = styled.div`
      grid-row: 1 / 2;
      grid-column: 2 / 3;
      margin: 6px 4px 0 0;
      height: 46px; overflow: hidden; font-size: 18px; line-height: 23px;
      font-weight: ${selectedIx === index ? 800 : 400};
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2
      `
    const DateField = styled.div`
      grid-row: 2 / 3;
      grid-column: 2 / 3;
      margin-right: 4px;
      font-size: 13px; color: #666; text-align: right; font-family: Andale Mono
      `

    return (
      <ArticleRow key={key} onClick={() => {clicked(artcles[index]); setSelectedIx(index)}} >
        <Thumb src={blobToImage(artcles[index].thumb)}/>
        <Title>{artcles[index].title}</Title>
        <DateField>{toYMD(artcles[index].created_at)}</DateField>
      </ArticleRow>
    )
  }

  return (
    <List
      rowCount={artcles.length}
      width={listWidth}
      height={listHeight}
      rowHeight={listRowHeight}
      rowRenderer={rowRenderer}
      overscanRowCount={3}
      style={{outline: "none"}} />
  )
}

type ShowContentProps = {
  url: string
  title: string
  noPdf: boolean
  pdfWidth: number
  pdfHeight: number
  loaded: () => void
}
const ShowContent: React.FC<ShowContentProps> = ({url, title, noPdf, pdfWidth, pdfHeight, loaded}) => {
  if (noPdf) {
    const LinkPage = styled.div`margin-top: 100px; font-size: 20px; text-align: center`
    return (
      <LinkPage> <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></LinkPage>
    )
  } else {
    const iframeStyles = {width: pdfWidth - 16, height: pdfHeight, border: "none"}
    return (
      <iframe src={url} title={title} onLoad={() => loaded()} style={iframeStyles}/>
    )
  }
}

ReactDOM.render(
  <FirebaseAuthProvider firebase={firebase}>
    <App />
  </FirebaseAuthProvider>,
  document.getElementById('root')
)
