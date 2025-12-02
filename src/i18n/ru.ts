import type { Translations } from "../services/I18nService.ts";

/**
 * Russian translations
 */
export const ru: Translations = {
  // Widget header & general
  "widget.header.title": "ПОДДЕРЖАТЬ",
  "widget.loading": "Загрузка виджета...",
  "widget.footer.contact": "Связаться с разработчиками",

  // Amount section
  "amount.tooltip": "Любой токен, любая сеть — автоконвертация",
  "amount.helper": "Какую сумму вы хотите пожертвовать?",
  "amount.ariaLabel": "Сумма пожертвования",
  "amount.presetAriaLabel": "Установить сумму {currency}{amount}",

  // Wallet connection
  "wallet.connecting": "Подключение...",
  "wallet.connect": "Подключить кошелёк",
  "wallet.connectSubtext": "Для завершения пожертвования",
  "wallet.connectAriaLabel": "Подключить кошелёк",
  "wallet.disconnectAriaLabel": "Отключить кошелёк",
  "wallet.switchNetworkAriaLabel": "Сменить сеть",

  // Donate button
  "donate.processing": "Обработка...",
  "donate.calculating": "Расчёт...",
  "donate.pay": "Оплатить",
  "donate.payWithAmount": "Оплатить {amount} {token}",
  "donate.processingAriaLabel": "Обработка платежа, пожалуйста подождите",
  "donate.calculatingAriaLabel": "Расчёт суммы платежа, пожалуйста подождите",
  "donate.disabledAriaLabel": "кнопка неактивна",

  // Success state
  "success.defaultMessage": "Спасибо за ваше пожертвование!",
  "success.donateAgain": "Пожертвовать снова",
  "success.youDonated": "Вы пожертвовали {amount}",
  "success.amount": "Сумма",
  "success.network": "Сеть",
  "success.recipient": "Получатель",
  "success.time": "Время",
  "success.transactionDetails": "Детали транзакции",

  // Token selection
  "token.choosePayment": "Выберите токен для оплаты",
  "token.insufficientBalance": "недостаточный баланс",
  "token.selectionAriaLabel": "Выбор токена",
  "token.noTokensWithBalance": "Нет токенов с балансом",
  "token.noTokensWithBalanceHint": "Пополните кошелёк для пожертвования",

  // Toast notifications
  "toast.successAriaLabel": "Уведомление об успехе",
  "toast.errorAriaLabel": "Уведомление об ошибке",
  "toast.warningAriaLabel": "Предупреждение",
  "toast.infoAriaLabel": "Информационное уведомление",
  "toast.closeAriaLabel": "Закрыть уведомление",

  // Messages
  "message.donationSuccess": "Пожертвование успешно! Спасибо за вашу поддержку.",
  "message.invalidRecipient": "Неверный формат адреса получателя",
  "message.initFailed": "Не удалось инициализировать виджет",
  "message.walletConnectionFailed": "Не удалось открыть подключение кошелька",
};

