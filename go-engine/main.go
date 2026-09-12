// Nozez Was Here: Nozez Whatsmeow Engine
// High-performance WhatsApp bot library bridging Go engine (whatsmeow) and Node.js via Stdio IPC
// Under the MIT License (MIT). Copyright (c) 2026 Nozez. All rights reserved.

package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

type IPCEvent struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type IPCCommand struct {
	Action  string          `json:"action"`
	ID      string          `json:"id"`
	Payload json.RawMessage `json:"payload"`
}

type SendMessagePayload struct {
	JID          string `json:"jid"`
	Text         string `json:"text"`
	QuotedID     string `json:"quotedId"`
	QuotedSender string `json:"quotedSender"`
}

type SendMediaPayload struct {
	JID          string `json:"jid"`
	MediaType    string `json:"mediaType"`
	FilePath     string `json:"filePath"`
	Caption      string `json:"caption"`
	FileName     string `json:"fileName"`
	QuotedID     string `json:"quotedId"`
	QuotedSender string `json:"quotedSender"`
}

type DownloadMediaPayload struct {
	MessageID string `json:"messageId"`
	OutputDir string `json:"outputDir"`
}

type PairPhonePayload struct {
	Phone string `json:"phone"`
}

type GroupJIDPayload struct {
	JID string `json:"jid"`
}

type GroupParticipantsPayload struct {
	JID          string   `json:"jid"`
	Participants []string `json:"participants"`
	Action       string   `json:"action"`
}

type GroupSettingPayload struct {
	JID     string `json:"jid"`
	Setting string `json:"setting"`
}

var (
	msgCache      = make(map[string]*events.Message)
	msgCacheMutex sync.RWMutex
)

func sendIPC(event string, data interface{}) {
	payload, err := json.Marshal(IPCEvent{
		Event: event,
		Data:  data,
	})

	if err == nil {
		fmt.Println(string(payload))
	}
}

func extractMediaMessage(msg *waProto.Message) (*waProto.Message, string, string) {
	if msg == nil {
		return nil, "", ""
	}

	if img := msg.GetImageMessage(); img != nil {
		ext := ".jpg"
		if img.GetMimetype() == "image/png" {
			ext = ".png"
		}
		return msg, ext, "image"
	}

func unwrapMessage(msg *waProto.Message) (*waProto.Message, bool) {
	if msg == nil {
		return nil, false
	}
	isVO := false
	if vo := msg.GetViewOnceMessage(); vo != nil && vo.Message != nil {
		msg = vo.Message
		isVO = true
	}
	if voV2 := msg.GetViewOnceMessageV2(); voV2 != nil && voV2.Message != nil {
		msg = voV2.Message
		isVO = true
	}
	if voV2Ext := msg.GetViewOnceMessageV2Extension(); voV2Ext != nil && voV2Ext.Message != nil {
		msg = voV2Ext.Message
		isVO = true
	}
	return msg, isVO
}

func extractMediaMessage(msg *waProto.Message) (*waProto.Message, string, string) {
	if msg == nil {
		return nil, "", ""
	}

	msg, _ = unwrapMessage(msg)

	if img := msg.GetImageMessage(); img != nil {
		ext := ".jpg"
		if img.GetMimetype() == "image/png" {
			ext = ".png"
		}
		return msg, ext, "image"
	}

	if msg.GetVideoMessage() != nil {
		return msg, ".mp4", "video"
	}

	if msg.GetStickerMessage() != nil {
		return msg, ".webp", "sticker"
	}

	if aud := msg.GetAudioMessage(); aud != nil {
		ext := ".mp3"
		if strings.Contains(aud.GetMimetype(), "ogg") {
			ext = ".ogg"
		}
		return msg, ext, "sound"
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		ext := filepath.Ext(doc.GetFileName())
		if ext == "" {
			ext = ".bin"
		}
		return msg, ext, "document"
	}

	if extMsg := msg.GetExtendedTextMessage(); extMsg != nil &&
		extMsg.ContextInfo != nil &&
		extMsg.ContextInfo.QuotedMessage != nil {
		return extractMediaMessage(extMsg.ContextInfo.QuotedMessage)
	}

	return nil, "", ""
}

func parseMessageContent(msg *waProto.Message) (string, string) {
	if msg == nil {
		return "Chat", ""
	}

	unwrapped, _ := unwrapMessage(msg)
	if unwrapped != nil {
		msg = unwrapped
	}

	if text := msg.GetConversation(); text != "" {
		return "Chat", text
	}

	if extText := msg.GetExtendedTextMessage(); extText != nil {
		return "Chat", extText.GetText()
	}

	if img := msg.GetImageMessage(); img != nil {
		if caption := img.GetCaption(); caption != "" {
			return "Image", caption
		}
		return "Image", "Mengirimkan Gambar"
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		if caption := vid.GetCaption(); caption != "" {
			return "Video", caption
		}
		return "Video", "Mengirimkan Video"
	}

	if msg.GetStickerMessage() != nil {
		return "Sticker", "Mengirimkan Stiker"
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		if fileName := doc.GetFileName(); fileName != "" {
			return "Document", fileName
		}
		return "Document", "Mengirimkan Dokumen"
	}

	if msg.GetAudioMessage() != nil {
		return "Audio", "Mengirimkan Audio"
	}

	return "Chat", ""
}

func main() {
	ctx := context.Background()

	sessionName := "nozez"

	if len(os.Args) > 1 && os.Args[1] != "" {
		sessionName = os.Args[1]
	}

	sessionDir := filepath.Join("../sessions", sessionName)

	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		panic(err)
	}

	dbPath := filepath.Join(sessionDir, "whatsmeow.db")

	dbLog := waLog.Stdout("Database", "ERROR", true)

	container, err := sqlstore.New(
		ctx,
		"sqlite3",
		fmt.Sprintf("file:%s?_foreign_keys=on", dbPath),
		dbLog,
	)

	if err != nil {
		panic(err)
	}

	deviceStore, err := container.GetFirstDevice(ctx)

	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "ERROR", true)

	client := whatsmeow.NewClient(deviceStore, clientLog)

	client.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {

		case *events.Connected:
			botJid := ""
			if client.Store.ID != nil {
				botJid = client.Store.ID.ToNonAD().String()
			}
			sendIPC("connection.update", map[string]interface{}{
				"open":   true,
				"botJid": botJid,
			})

		case *events.LoggedOut:
			sendIPC("connection.update", map[string]interface{}{
				"open":   false,
				"reason": "logged_out",
			})

		case *events.Disconnected:
			sendIPC("connection.update", map[string]interface{}{
				"open":   false,
				"reason": "connection_lost",
			})

		case *events.QR:
			sendIPC("qr", map[string]interface{}{
				"codes": v.Codes,
			})

		case *events.PairSuccess:
			sendIPC("connection.update", map[string]interface{}{
				"open":   true,
				"botJid": v.ID.String(),
			})

		case *events.Message:
			msgCacheMutex.Lock()
			msgCache[v.Info.ID] = v
			if len(msgCache) > 1000 {
				for id := range msgCache {
					delete(msgCache, id)
					break
				}
			}
			msgCacheMutex.Unlock()

			msgType, body := parseMessageContent(v.Message)
			pushName := v.Info.PushName
			if pushName == "" {
				pushName = "User"
			}

			senderJid := v.Info.Sender.ToNonAD().String()
			chatJid := v.Info.Chat.ToNonAD().String()

			quotedMsgId := ""
			quotedSender := ""
			if extMsg := v.Message.GetExtendedTextMessage(); extMsg != nil && extMsg.ContextInfo != nil {
				quotedMsgId = extMsg.ContextInfo.GetStanzaID()
				if extMsg.ContextInfo.Participant != nil {
					quotedSender = *extMsg.ContextInfo.Participant
				}
			}

			_, isViewOnce := unwrapMessage(v.Message)

			metaData := map[string]interface{}{
				"chat":         chatJid,
				"senderJid":    senderJid,
				"pushname":     pushName,
				"msgType":      msgType,
				"body":         body,
				"quotedId":     quotedMsgId,
				"quotedSender": quotedSender,
				"isViewOnce":   isViewOnce,
			}

			rawData := map[string]interface{}{
				"id":        v.Info.ID,
				"chat":      chatJid,
				"senderJid": senderJid,
				"isFromMe":  v.Info.IsFromMe,
				"timestamp": v.Info.Timestamp.Unix(),
				"pushName":  pushName,
			}

			sendIPC("messages.upsert", map[string]interface{}{
				"meta": metaData,
				"raw":  rawData,
			})
		}
	})

	if client.Store.ID == nil {
		qrChan, _ := client.GetQRChannel(ctx)
		err = client.Connect()
		if err != nil {
			panic(err)
		}

		go func() {
			for evt := range qrChan {
				if evt.Event == "code" {
					sendIPC("qr", map[string]interface{}{
						"codes": []string{evt.Code},
					})
				}
			}
		}()
	} else {
		err = client.Connect()
		if err != nil {
			panic(err)
		}
	}

	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			line := scanner.Text()
			var cmd IPCCommand
			if err := json.Unmarshal([]byte(line), &cmd); err != nil {
				continue
			}

			go handleIPCCommand(client, cmd)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	client.Disconnect()
}

func handleIPCCommand(client *whatsmeow.Client, cmd IPCCommand) {
	switch cmd.Action {
	case "request_pairing_code":
		var p PairPhonePayload
		if err := json.Unmarshal(cmd.Payload, &p); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}
		phone := strings.TrimPrefix(p.Phone, "+")
		code, err := client.PairPhone(phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}
		sendIPC("pairing_code", map[string]interface{}{"code": code})
		sendIPC("response", map[string]interface{}{"id": cmd.ID, "success": true, "code": code})

	case "send_message":
		var p SendMessagePayload
		if err := json.Unmarshal(cmd.Payload, &p); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}
		targetJID, err := types.ParseJID(p.JID)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Invalid JID"})
			return
		}

		msg := &waProto.Message{
			Conversation: proto.String(p.Text),
		}

		resp, err := client.SendMessage(context.Background(), targetJID, msg)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}

		sendIPC("response", map[string]interface{}{"id": cmd.ID, "success": true, "msgId": resp.ID})

	case "send_media":
		var p SendMediaPayload
		if err := json.Unmarshal(cmd.Payload, &p); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}
		targetJID, err := types.ParseJID(p.JID)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Invalid JID"})
			return
		}

		data, err := os.ReadFile(p.FilePath)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "File read error: " + err.Error()})
			return
		}

		var waMediaType whatsmeow.MediaType
		switch p.MediaType {
		case "image":
			waMediaType = whatsmeow.MediaImage
		case "video":
			waMediaType = whatsmeow.MediaVideo
		case "audio", "ptt":
			waMediaType = whatsmeow.MediaAudio
		default:
			waMediaType = whatsmeow.MediaDocument
		}

		uploaded, err := client.Upload(context.Background(), data, waMediaType)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Upload error: " + err.Error()})
			return
		}

		var msg *waProto.Message
		switch p.MediaType {
		case "image":
			msg = &waProto.Message{
				ImageMessage: &waProto.ImageMessage{
					URL:           proto.String(uploaded.URL),
					DirectPath:    proto.String(uploaded.DirectPath),
					MediaKey:      uploaded.MediaKey,
					Mimetype:      proto.String("image/jpeg"),
					FileEncSHA256: uploaded.FileEncSHA256,
					FileSHA256:    uploaded.FileSHA256,
					FileLength:    proto.Uint64(uploaded.FileLength),
					Caption:       proto.String(p.Caption),
				},
			}
		case "video":
			msg = &waProto.Message{
				VideoMessage: &waProto.VideoMessage{
					URL:           proto.String(uploaded.URL),
					DirectPath:    proto.String(uploaded.DirectPath),
					MediaKey:      uploaded.MediaKey,
					Mimetype:      proto.String("video/mp4"),
					FileEncSHA256: uploaded.FileEncSHA256,
					FileSHA256:    uploaded.FileSHA256,
					FileLength:    proto.Uint64(uploaded.FileLength),
					Caption:       proto.String(p.Caption),
				},
			}
		case "audio", "ptt":
			isPtt := p.MediaType == "ptt"
			msg = &waProto.Message{
				AudioMessage: &waProto.AudioMessage{
					URL:           proto.String(uploaded.URL),
					DirectPath:    proto.String(uploaded.DirectPath),
					MediaKey:      uploaded.MediaKey,
					Mimetype:      proto.String("audio/ogg; codecs=opus"),
					FileEncSHA256: uploaded.FileEncSHA256,
					FileSHA256:    uploaded.FileSHA256,
					FileLength:    proto.Uint64(uploaded.FileLength),
					PTT:           proto.Bool(isPtt),
				},
			}
		default:
			msg = &waProto.Message{
				DocumentMessage: &waProto.DocumentMessage{
					URL:           proto.String(uploaded.URL),
					DirectPath:    proto.String(uploaded.DirectPath),
					MediaKey:      uploaded.MediaKey,
					Mimetype:      proto.String("application/octet-stream"),
					FileEncSHA256: uploaded.FileEncSHA256,
					FileSHA256:    uploaded.FileSHA256,
					FileLength:    proto.Uint64(uploaded.FileLength),
					FileName:      proto.String(p.FileName),
				},
			}
		}

		resp, err := client.SendMessage(context.Background(), targetJID, msg)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}

		sendIPC("response", map[string]interface{}{"id": cmd.ID, "success": true, "msgId": resp.ID})

	case "download_media":
		var p DownloadMediaPayload
		if err := json.Unmarshal(cmd.Payload, &p); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": err.Error()})
			return
		}
		msgCacheMutex.RLock()
		cachedMsg, exists := msgCache[p.MessageID]
		msgCacheMutex.RUnlock()

		if !exists || cachedMsg == nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Message not in cache"})
			return
		}

		mediaMsg, ext, mediaType := extractMediaMessage(cachedMsg.Message)
		if mediaMsg == nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "No media found in message"})
			return
		}

		var downloadable whatsmeow.DownloadableMessage
		if img := mediaMsg.GetImageMessage(); img != nil {
			downloadable = img
		} else if vid := mediaMsg.GetVideoMessage(); vid != nil {
			downloadable = vid
		} else if st := mediaMsg.GetStickerMessage(); st != nil {
			downloadable = st
		} else if aud := mediaMsg.GetAudioMessage(); aud != nil {
			downloadable = aud
		} else if doc := mediaMsg.GetDocumentMessage(); doc != nil {
			downloadable = doc
		}

		data, err := client.Download(context.Background(), downloadable)
		if err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Download error: " + err.Error()})
			return
		}

		if err := os.MkdirAll(p.OutputDir, 0755); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Mkdir error: " + err.Error()})
			return
		}

		fileName := fmt.Sprintf("%s_%s%s", mediaType, p.MessageID, ext)
		filePath := filepath.Join(p.OutputDir, fileName)

		if err := os.WriteFile(filePath, data, 0644); err != nil {
			sendIPC("response", map[string]interface{}{"id": cmd.ID, "error": "Write file error: " + err.Error()})
			return
		}

		sendIPC("response", map[string]interface{}{
			"id":        cmd.ID,
			"success":   true,
			"filePath":  filePath,
			"mediaType": mediaType,
		})
	}
}
